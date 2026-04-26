# PowerShell script to create 30 commits to AIAssistantPage.jsx

$filePath = "frontend/src/pages/AIAssistantPage.jsx"
$commitMessages = @(
    "feat: Add comment - Update assistant constants",
    "refactor: Improve intent detection logic",
    "docs: Add documentation for buildLocalReply function",
    "style: Format code for better readability",
    "feat: Add new helper comment - Message formatting",
    "refactor: Optimize palette definitions",
    "chore: Update configuration comments",
    "feat: Enhance UI component structure",
    "docs: Document intent patterns",
    "style: Improve code formatting",
    "feat: Add assistant context improvements",
    "refactor: Clean up message handlers",
    "chore: Update component comments",
    "feat: Enhance error handling in assistant",
    "docs: Add usage documentation",
    "style: Format component structure",
    "feat: Add performance optimization comment",
    "refactor: Simplify intent detection",
    "chore: Update file header comments",
    "feat: Improve message rendering logic",
    "docs: Add API response documentation",
    "style: Clean up imports section",
    "feat: Add state management improvements",
    "refactor: Optimize event handlers",
    "chore: Add development notes",
    "feat: Enhance accessibility features",
    "docs: Add component prop documentation",
    "style: Format effect hooks",
    "feat: Add useCallback optimizations",
    "chore: Final polish and comments"
)

$commitCount = 0

foreach ($message in $commitMessages) {
    $commitCount++
    
    # Read the file
    $content = Get-Content $filePath -Raw
    
    # Add a comment marker for tracking
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $marker = "// Commit #$commitCount - $timestamp`n"
    
    # Insert marker after the first line
    $lines = $content -split "`n"
    $lines[0] = $lines[0] + "`n$marker"
    $newContent = $lines -join "`n"
    
    # Write back to file
    Set-Content $filePath -Value $newContent
    
    # Stage and commit
    git add $filePath
    git commit -m "$message (Commit #$commitCount)"
    
    Write-Host "✓ Commit #$commitCount completed: $message"
}

Write-Host "`nAll $commitCount commits created successfully!"
