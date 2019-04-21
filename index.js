/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
const rp = require('request-promise-native');
const { auth } = require('google-auth-library');
const k8s = require('@kubernetes/client-node');
const { CIRCLE_TOKEN, GCE_CLUSTER_ID, GCE_ZONE } = process.env;

exports.triggerCIWorkflow = async (req, res) => {
  const { action, number, pull_request: { head: { ref: branch } }, repository: { name, full_name } } = req.body;
  const vcs_type = 'github';
  const options = {
    method: 'POST',
    uri: `https://circleci.com/api/v1.1/project/${vcs_type}/${full_name}/build?circle-token=${CIRCLE_TOKEN}`,
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json'
    },
    body: { branch },
    json: true
  }

  try {
    if (action === 'closed') {
      const namespace = `${name.toLowerCase()}-svc-pr-${number}`;
      const result = await deleteNamespace(namespace);
      return res.status(200).json({ status: 200, body: result });
    }

    if (action === 'opened') {
      const response = await rp(options);
      return res.status(200).json({ status: 200, body: response });
    }

    return res.status(200).json({ status: 200, body: 'Build skipped' });
  } catch (error) {
    console.error(error)
    return res.status(500).json({status: 500, error });
  }

  async function deleteNamespace(namespace) {
    const k8sApi = await authorize();
    return await k8sApi.deleteNamespace(namespace, {});
  }

  async function authorize() {
    const cluster = await getCluster(GCE_ZONE, GCE_CLUSTER_ID);
    const token = await auth.getAccessToken();
    const k8sApi = new k8s.Core_v1Api('https://' + cluster.endpoint);
    k8sApi.setDefaultAuthentication({
      applyToRequest: (opts) => {
        opts.ca = Buffer.from(cluster.masterAuth.clusterCaCertificate, 'base64');
        if (!opts.headers) {
          opts.headers = [];
        }
        opts.headers.Authorization = 'Bearer ' + token;
      },
    });
    return k8sApi;
  }

  async function getCluster(zone, clusterId) {
    const googleApi = await getGoogleApi();
    const projectId = googleApi.projectId;
    const res = await googleApi.client.request({
      url: `https://container.googleapis.com/v1/projects/${projectId}/zones/${zone}/clusters/${clusterId}`,
    });
    return res.data;
  }

  async function getGoogleApi() {
    const res = await auth.getApplicationDefault();
    const client = res.credential;

    return {
      client: client,
      projectId: res.projectId,
    };
  }
};