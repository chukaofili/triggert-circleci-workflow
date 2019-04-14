/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
const rp = require('request-promise-native');
exports.triggerCIWorkflow = async (req, res) => {
  const { action, pull_request: { head: { ref: branch } }, repository: { full_name } } = req.body;
  const vcs_type = 'github';
  const options = {
    method: 'POST',
    uri: `https://circleci.com/api/v1.1/project/${vcs_type}/${full_name}/build?circle-token=${process.env.CIRCLE_TOKEN}`,
    headers: {
      'content-type': 'application/json'
    },
    body: { branch },
    json: true
  }

  try {
    if (action !== 'opened') return res.status(200).json({ status: 200, body: 'Build skipped' })
    const response = await rp(options);
    return res.status(200).json(response);
  } catch (error) {
    console.error(error)
    return res.status(500).json(error);
  }
};