// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
const ethers = require('ethers')
const fs = require('fs')
require('dotenv').config()

const handler = async (event) => {
  try {
    let showImageInstead = false
    let address = event.path.substr(event.path.lastIndexOf('/') + 1)
    if (event.queryStringParameters.image) {
      showImageInstead = true
    }
    const isAddress = address.indexOf("0x") === 0 && address.length === 42
    if (!isAddress) {
      address = '0x' + BigInt(address).toString(16).padStart(40, '0')
    }
    let name = false

    try {
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
      name = await provider.lookupAddress(address)
    } catch (error) {
      console.log('error looking up name', error)
    }


    const url = `https://app.eigenlayer.xyz/api/trpc/tokenStaking.getRestakingPoints,nativeStaking.getNativeStakingSummaryByEigenpod?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22staker%22%3A%22${address}%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22podOwnerAddress%22%3A%22${address}%22%7D%7D%7D`
    const response = await fetch(url);
    const data = await response.json();
    // console.dir({ data }, { depth: null })
    const points = ethers.utils.formatEther((data[0].result.data.json.reduce((total, obj) => total + BigInt(obj.integratedShares), BigInt(0)) / 3600n).toString())

    const image = generateImage(name || address, points, showImageInstead)
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

    if (showImageInstead) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'image/svg+xml' },
        body: image
      }
    }

    // return image response
    return {
      statusCode: 200,
      body: JSON.stringify(metadata)
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
        value: parseFloat(points)
      }
    ]
  } else {
    attributes = [
      { key: 'points', value: parseFloat(points), type: 'number' }
    ]
  }
  return attributes
}


const generateImage = (address, points, returnImageOnly = false) => {
  const filename = '/svg-template.svg'
  const svgTemplate = fs.readFileSync(__dirname + filename, 'utf8').replace('%address%', address).replace('%points%', points)
  if (returnImageOnly) return svgTemplate
  const svgBase64 = Buffer.from(svgTemplate).toString('base64')
  const svg = `data:image/svg+xml;base64,${svgBase64}`
  return svg
}


module.exports = { handler }
