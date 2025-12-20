---
description: Deploy the application to Firebase Hosting and Cloud Functions
---

# Deploy to Production

This workflow automates the deployment process for the Sonash application.

1. **Check Git Status**
    Ensure the working directory is clean before deploying.

    ```bash
    git status
    ```

2. **Build the Project**
    Build the Next.js application to ensure there are no errors.

    ```bash
    npm run build
    ```

3. **Deploy to Firebase**
    Deploy specific services or the entire application.
    // turbo

    ```bash
    firebase deploy
    ```

4. **Verify Deployment**
    Check the hosting URL to ensure the site is live.

    ```bash
    echo "Deployment complete! Visit: https://sonash-app.web.app"
    ```
