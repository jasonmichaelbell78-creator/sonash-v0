---
description: Deploy the application to Firebase Hosting and Cloud Functions
---

# Deploy to Production

This workflow automates the deployment process for the Sonash application.

1. **Fetch Latest Changes**
    Check if there are updates on the remote repository.
    // turbo

    ```bash
    git fetch origin
    ```

2. **Verify Git Sync**
    Ensure local branch is up-to-date with remote.
    // turbo

    ```bash
    git status
    ```

3. **Pull Latest Code**
    Get the latest code from GitHub before building.
    // turbo

    ```bash
    git pull origin main
    ```

4. **Verify Clean Working Tree**
    Ensure no uncommitted changes before deploying.
    // turbo

    ```bash
    git status
    ```

5. **Build the Project**
    Build the Next.js application to ensure there are no errors.

    ```bash
    npm run build
    ```

6. **Deploy to Firebase**
    Deploy to Firebase Hosting and Cloud Functions.
    // turbo

    ```bash
    firebase deploy
    ```

7. **Verify Deployment**
    Check the hosting URL to ensure the site is live.

    ```bash
    echo "Deployment complete! Visit: https://sonash-app.web.app"
    ```
