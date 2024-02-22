// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
const handler = async (event) => {
  try {
    const address = event.path.substr(event.path.lastIndexOf('/') + 1)

    const url = `https://app.eigenlayer.xyz/api/trpc/tokenStaking.getRestakingPoints,nativeStaking.getNativeStakingSummaryByEigenpod?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22staker%22%3A%22${address}%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22podOwnerAddress%22%3A%22${address}%22%7D%7D%7D`
    const response = await fetch(url);

    console.log({ response })
    const data = await response.json();
    const points = data[0].result.data.json.reduce((total, obj) => total + parseInt(obj.integratedShares), 0)

    const image = generateImage(address, points)

    const attributesOS = generateAttributes(points, 'opensea')
    const attributesRB = generateAttributes(points, 'rarebits')

    // the sauce
    const metadata = {
      // both opensea and rarebits
      name: `${points} points for safe ${address}`,
      // owner,

      description: `This NFT provides ownership and access to the Gnosis Safe at ${address} as well as all ${points} non-transferrable points accrued to this account.`,

      // opensea
      external_url: `https://on-chain-points.netlify.app`,
      // rarebits
      home_url: `https://on-chain-points.netlify.app`,

      // opensea
      image,

      // rarebits
      image_url: image,

      // opensea
      attributes: attributesOS,
      // rarebits
      properties: attributesRB,
    }

    // return image response
    return {
      statusCode: 200,
      // headers: {'Content-Type': 'image/svg+xml'},
      body: JSON.stringify(metadata)//image
    }

  } catch (error) {
    return { statusCode: 500, body: error.toString() }
  }
}


const generateAttributes = (points, type) => {
  let attributes
  if (type === 'opensea') {
    attributes = [
      {
        trait_type: 'points',
        value: points
      }
    ]
  } else {
    attributes = [
      { key: 'points', value: points, type: 'number' }
    ]
  }
  return attributes
}


const generateImage = (address, points, base64 = true) => {
  const svgTemplate = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">\n
  <rect width="100%" height="100%" fill="black" />\n
  <text x="10" y="20" font-family="Arial" font-size="20" fill="white">Address: ${address}</text>\n
  <text x="10" y="40" font-family="Arial" font-size="20" fill="white">Points: ${points}</text>\n
</svg>`
  if (!base64) return svgTemplate
  const svgBase64 = Buffer.from(svgTemplate).toString('base64')
  const svg = `data:image/svg+xml;base64,${svgBase64}`
  return svg
}


module.exports = { handler }
