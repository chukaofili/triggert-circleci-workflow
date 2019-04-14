/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
exports.triggerCIWorkflow = (req, res) => {
  const { action, head: { ref: branch }, repository: { full_name } } = req.body;
  const vcs_type = 'github';
  const url = `https://circleci.com/api/v1.1/project/${vcs_type}/${full_name}/build?circle-token=${process.env.CIRCLE_TOKEN}`;
  const options = {
    method: 'post',
    headers: {
      "Content-type": "application/json"
    },
    body: {
      branch
    }
  }

  try {
    if (action !== 'opened') return res.status(200).json({status: 200, body: 'Build skipped'})
    const response = await fetch(url, options).then((result) => { return result.json(); });
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json(error);
  }
};