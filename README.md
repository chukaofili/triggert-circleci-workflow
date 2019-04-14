# Trigger Circle CI Workflow Builds

Description: Google Cloud Function to triger automated build on the circle ci platform.

## Deployment

1. Get your CircleCI.com personal token. 
2. Create `.env.yaml` in the proejct root (You can use the `.env.yaml.example` file included).
3. Add `CIRCLE_TOKEN: [TOKEN-HERE]`.
4. Deploy using `gcloud functions deploy triggerCIWorkflow --env-vars-file .env.yaml --runtime nodejs8 --trigger-http`.