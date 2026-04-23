import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const isSecureForSpeech = () => {
  if (typeof window === 'undefined') return false
  if (window.isSecureContext) return true
  const host = window.location?.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

const normalize = (text) => String(text || '').trim().replace(/\s+/g, ' ')
const normalizeForWake = (text) =>
  normalize(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')

export function useWakeWordSpeech({
  wakeWordRegex,
  lang = 'en-US',
  requireWakeWord = true,
  onWake,
  onCommandText,
  onCommandFinal,
  commandIdleMs = 1200,
  awakeIdleMs = 6000,
}) {
  const SpeechRecognition = useMemo(() => getSpeechRecognition(), [])

  const supported = Boolean(SpeechRecognition)
  const [listening, setListening] = useState(false)
  const [awake, setAwake] = useState(false)
  const [error, setError] = useState(null)
  const [lastHeard, setLastHeard] = useState('')
  const [audioActive, setAudioActive] = useState(false)
  const [speechActive, setSpeechActive] = useState(false)

  const recognitionRef = useRef(null)
  const startRef = useRef(null)
  const listeningRef = useRef(false)
  const awakeRef = useRef(false)
  const wakeBufferRef = useRef('')
  const commandBufferRef = useRef('')
  const finalizeTimerRef = useRef(null)
  const awakeTimerRef = useRef(null)

  const wakeRegex = useMemo(() => {
    if (wakeWordRegex instanceof RegExp) return wakeWordRegex
    return /\b(hey|hi)\s+libby(\s+ai)?\b/i
  }, [wakeWordRegex])

  const setAwakeState = useCallback(
    (next) => {
      awakeRef.current = next
      setAwake(next)
    },
    [setAwake]
  )

  const emitCommandText = useCallback(
    (text) => {
      const normalized = normalize(text)
      commandBufferRef.current = normalized
      onCommandText?.(normalized)
    },
    [onCommandText]
  )

  const resetWakeBuffer = useCallback(() => {
    wakeBufferRef.current = ''
  }, [])

  const clearFinalizeTimer = useCallback(() => {
    if (finalizeTimerRef.current) {
      clearTimeout(finalizeTimerRef.current)
      finalizeTimerRef.current = null
    }
  }, [])

  const clearAwakeTimer = useCallback(() => {
    if (awakeTimerRef.current) {
      clearTimeout(awakeTimerRef.current)
      awakeTimerRef.current = null
    }
  }, [])

  const armAwakeTimeout = useCallback(() => {
    clearAwakeTimer()
    awakeTimerRef.current = setTimeout(() => {
      awakeTimerRef.current = null
      // No command followed after wake word; return to wake mode
      commandBufferRef.current = ''
      onCommandText?.('')
      setAwakeState(false)
      resetWakeBuffer()
    }, Math.max(1000, Number(awakeIdleMs) || 6000))
  }, [awakeIdleMs, clearAwakeTimer, onCommandText, resetWakeBuffer, setAwakeState])

  const finalizeCommandSoon = useCallback(() => {
    clearFinalizeTimer()
    finalizeTimerRef.current = setTimeout(() => {
      finalizeTimerRef.current = null
      const finalText = normalize(commandBufferRef.current)
      if (finalText) {
        onCommandFinal?.(finalText)
      }
      // Return to wake-word mode for the next command
      commandBufferRef.current = ''
      onCommandText?.('')
      setAwakeState(false)
      resetWakeBuffer()
    }, Math.max(250, Number(commandIdleMs) || 1200))
  }, [
    clearFinalizeTimer,
    commandIdleMs,
    onCommandFinal,
    onCommandText,
    resetWakeBuffer,
    setAwakeState,
  ])

  const appendToWakeBuffer = useCallback((chunk) => {
    if (!chunk) return
    const next = normalize(`${wakeBufferRef.current} ${chunk}`)
    // Keep buffer bounded so it doesn't grow forever
    wakeBufferRef.current = next.slice(-80)
  }, [])

  const appendToCommand = useCallback(
    (chunk) => {
      if (!chunk) return
      const next = normalize(`${commandBufferRef.current} ${chunk}`)
      emitCommandText(next)
    },
    [emitCommandText]
  )

  const stop = useCallback(() => {
    listeningRef.current = false
    setListening(false)
    setAwakeState(false)
    resetWakeBuffer()
    clearFinalizeTimer()
    clearAwakeTimer()
    commandBufferRef.current = ''
    onCommandText?.('')
    setLastHeard('')
    setAudioActive(false)
    setSpeechActive(false)

    const recognition = recognitionRef.current
    if (!recognition) return

    // Important: clear ref so we can start again even if onend won't fire.
    recognitionRef.current = null
    try {
      recognition.onend = null
      recognition.onresult = null
      recognition.onerror = null
      // abort() is more immediate and avoids some stuck states; fall back to stop().
      if (typeof recognition.abort === 'function') recognition.abort()
      else recognition.stop()
    } catch {
      // ignore
    }
  }, [clearAwakeTimer, clearFinalizeTimer, onCommandText, resetWakeBuffer, setAwakeState])

  const start = useCallback(() => {
    if (!SpeechRecognition) return
    if (recognitionRef.current) return

    if (!isSecureForSpeech()) {
      setError('insecure-context')
      stop()
      return
    }

    setError(null)
    setLastHeard('')
    setAudioActive(false)
    setSpeechActive(false)
    listeningRef.current = true
    setListening(true)
    setAwakeState(false)
    resetWakeBuffer()
    clearFinalizeTimer()
    clearAwakeTimer()

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    // Diagnostics: whether mic/audio is flowing
    recognition.onaudiostart = () => setAudioActive(true)
    recognition.onsoundstart = () => setAudioActive(true)
    recognition.onspeechstart = () => setSpeechActive(true)

    recognition.onresult = (event) => {
      const results = event.results
      if (!results || results.length === 0) return

      for (let i = event.resultIndex || 0; i < results.length; i++) {
        const r = results[i]
        const chunk = normalize(r?.[0]?.transcript)
        const isFinal = Boolean(r?.isFinal)
        if (!chunk) continue

        setLastHeard(chunk)

        if (!awakeRef.current) {
          appendToWakeBuffer(chunk)
          const wakeBufferRaw = wakeBufferRef.current
          const wakeBufferClean = normalizeForWake(wakeBufferRaw)

          if (wakeRegex.test(wakeBufferRaw) || wakeRegex.test(wakeBufferClean)) {
            setAwakeState(true)
            resetWakeBuffer()
            commandBufferRef.current = ''
            onWake?.()
            armAwakeTimeout()

            const after = normalize(wakeBufferRaw.replace(wakeRegex, ''))
            if (after && isFinal) {
              appendToCommand(after)
              finalizeCommandSoon()
            }
            continue
          }

          // If wake-word is not required (user explicitly armed mic), treat the utterance as a command.
          if (!requireWakeWord && isFinal) {
            setAwakeState(true)
            resetWakeBuffer()
            commandBufferRef.current = ''
            onWake?.()
            appendToCommand(chunk)
            finalizeCommandSoon()
          }
          continue
        }

        if (isFinal) {
          appendToCommand(chunk)
          finalizeCommandSoon()
        }
      }
    }

    recognition.onerror = (e) => {
      const code = e?.error || 'speech_error'
      setError(code)

      // Permission denied or blocked: stop trying to auto-restart.
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        stop()
      }
    }

    recognition.onend = () => {
      recognitionRef.current = null
      if (!listeningRef.current) return
      // After a pause/end, go back to wake-word mode.
      setAwakeState(false)
      resetWakeBuffer()
      clearFinalizeTimer()
      clearAwakeTimer()
      commandBufferRef.current = ''
      onCommandText?.('')

      // Restart to keep listening while armed.
      setTimeout(() => {
        if (!listeningRef.current) return
        startRef.current?.()
      }, 250)
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (e) {
      // If start() is called too quickly after another, the API can throw.
      setError(e?.name || e?.message || 'start_failed')
      recognitionRef.current = null
      stop()
    }
  }, [
    SpeechRecognition,
    appendToCommand,
    appendToWakeBuffer,
    armAwakeTimeout,
    clearFinalizeTimer,
    clearAwakeTimer,
    lang,
    requireWakeWord,
    onWake,
    onCommandText,
    finalizeCommandSoon,
    resetWakeBuffer,
    setAwakeState,
    stop,
    wakeRegex,
  ])

  useEffect(() => {
    startRef.current = start
  }, [start])

  const toggle = useCallback(() => {
    if (listeningRef.current) stop()
    else start()
  }, [start, stop])

  useEffect(() => {
    return () => stop()
  }, [stop])

  const statusText = useMemo(() => {
    if (!supported) return 'Voice not supported'
    if (!listening) return 'Voice off'
    if (awake) return 'Listening…'
    return 'Say “Hey Libby”'
  }, [awake, listening, supported])

  return {
    supported,
    listening,
    awake,
    error,
    statusText,
    lastHeard,
    audioActive,
    speechActive,
    start,
    stop,
    toggle,
  }
}
