$repoPath = "C:\Users\TUF\Desktop\turkoyunseferiweb"
Set-Location $repoPath

while ($true) {
    # Check if there are modified or untracked changes
    $status = git status --porcelain
    if ($status) {
        # Check if remote exists
        $remote = git remote
        if ($remote) {
            git add .
            git commit -m "auto: code sync"
            
            # Determine current branch name
            $branch = git branch --show-current
            if (-not $branch) {
                $branch = "master"
            }
            
            git push origin $branch
        }
    }
    Start-Sleep -Seconds 10
}
