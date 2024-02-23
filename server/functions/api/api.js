// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
const ethers = require('ethers')
const fs = require('fs')
console.log({ ethers })
const handler = async (event) => {
  try {
    let address = event.path.substr(event.path.lastIndexOf('/') + 1)
    const isAddress = address.indexOf("0x") === 0 && address.length === 42
    if (!isAddress) {
      address = '0x' + BigInt(address).toString(16).padStart(40, '0')
    }

    const url = `https://app.eigenlayer.xyz/api/trpc/tokenStaking.getRestakingPoints,nativeStaking.getNativeStakingSummaryByEigenpod?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22staker%22%3A%22${address}%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22podOwnerAddress%22%3A%22${address}%22%7D%7D%7D`
    const response = await fetch(url);
    const data = await response.json();
    console.dir({ data }, { depth: null })
    const points = ethers.utils.formatEther((data[0].result.data.json.reduce((total, obj) => total + BigInt(obj.integratedShares), BigInt(0)) / 3600n).toString())

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
  const filename = '/svg-template.svg'
  const svgTemplate = fs.readFileSync(__dirname + filename, 'utf8').replace('%address%', address).replace('%points%', points)

  // const svgTemplate = (`<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420">\n
  // <rect width="100%" height="100%" fill="lightgrey" />
  // <text x="10" y="380" font-family="Courier" font-weight="bold" font-size="20" fill="#180D68">
  //   <animate attributeType="XML" attributeName="x" from="460" to="-200" dur="5s" repeatCount="indefinite" />
  //   Address: %address%
  // </text>
  // <text x="10" y="405" font-family="Courier" font-weight="bold" font-size="20" fill="#180D68">
  //   <animate attributeType="XML" attributeName="x" from="420" to="-200" dur="5s" repeatCount="indefinite" />
  //   Points: %points%
  // </text>
  // <path
  //   d="m52.91,355.92l-52.91,0l0,-355.92l91.38,0l0,262.32c0,0.69 0,1.44 0.05,1.83c0.4,0.05 1.17,0.05 1.85,0.05l36.8,0c0.76,0 1.54,0 1.94,-0.05c0.05,-0.39 0.05,-1.16 0.05,-1.9l0,-81.31c0,-4.08 0.72,-4.79 4.85,-4.8l37.77,0c0.33,0 1,0 1.37,-0.05c0.05,-0.37 0.05,-1.06 0.05,-1.35c0,-41.99 0,-83.98 0,-125.99c0,-0.29 0,-0.95 -0.05,-1.32c-0.37,-0.05 -1.07,-0.05 -1.4,-0.05l-36.16,0c-4.06,0 -4.82,-0.78 -4.82,-4.89l0,-42.49l89.8,0l0,86.63c0,0.33 0,1 0.05,1.37c0.37,0.05 1.06,0.05 1.35,0.05c12.64,0 25.27,0 37.91,0c0.29,0 0.96,0 1.34,-0.05c0.05,-0.37 0.05,-1.06 0.05,-1.38l0,-2.24l0,-84.38l47.37,0l0,91.4l-42.49,0c-0.41,0 -1.12,0 -1.5,0.05c-0.05,0.39 -0.05,1.12 -0.05,1.55l0,81.46c0,4.31 -0.7,5.01 -4.96,5.01l-81.2,0c-0.48,0.01 -0.96,0.02 -1.44,0c-0.26,-0.01 -0.4,0.02 -0.46,0.04c0,0.02 -0.02,0.16 0,0.42c0.01,0.34 0,0.69 0,1.02l0,0.48l0,80.82c0,0.73 0,1.49 0.05,1.88c0.4,0.05 1.19,0.05 1.96,0.05l81.14,0c3.82,0 4.59,0.77 4.59,4.57l0,87.14l0.02,0.04l-214.29,0zm-49.9,-3.01l261.18,0l0,-84.13c0,-0.42 0,-1.13 -0.05,-1.52c-0.39,-0.05 -1.11,-0.05 -1.53,-0.05l-81.14,0c-4.32,0 -5.02,-0.7 -5.02,-4.95l0,-81.36c0,-0.28 0.02,-0.55 0,-0.84c-0.01,-0.37 0,-0.71 0.06,-1.04c-0.51,0.08 -1.11,0.11 -1.81,0.11l-37.77,0c-0.64,0 -1.4,0 -1.79,0.05c-0.05,0.4 -0.05,1.16 -0.05,1.73l0,81.31c0,4.27 -0.7,4.96 -5.01,4.96l-36.8,0c-4.23,0 -4.91,-0.69 -4.91,-4.89l0,-259.31l-85.37,0l0,349.89l0,0.02zm133.76,-308.62c0.4,0.06 1.25,0.06 1.75,0.06l36.16,0c3.62,0 4.45,0.83 4.45,4.38c0,41.99 0,83.98 0,125.99c0,0.7 -0.04,1.29 -0.11,1.79c0.31,-0.06 0.65,-0.08 1.02,-0.06c0.42,0.01 0.85,0 1.29,0l0.75,0l80.5,0c0.75,0 1.5,0 1.89,-0.05c0.05,-0.4 0.05,-1.18 0.05,-1.95l0,-81.47c0,-0.81 0.04,-1.48 0.13,-2.03c-0.52,0.08 -1.13,0.12 -1.85,0.12c-12.64,0 -25.28,0 -37.91,0c-3.58,0 -4.41,-0.83 -4.41,-4.43l0,-83.62l-83.78,0l0,39.48c0,0.51 0,1.4 0.07,1.81l-0.01,-0.01zm130.43,-41.28l0,83.63c0,0.73 -0.04,1.35 -0.13,1.87c0.55,-0.08 1.22,-0.12 2.01,-0.12l39.48,0l0,-85.38l-41.35,0z"
  //   fill="#180D68" id="svg_3" />
  // <path
  //   d="m2.19,2.86l87.44,-1.53l0.33,264.21l43.48,0.33l0.67,-86.96l43.14,-1.34l1,87.63l86.96,1.34l0.33,87.96l-263.88,0l0.52,-351.65z"
  //   fill="#180D68" id="svg_6" />
  // <path d="m178.11,177.78l-0.52,-131.96l-41.81,-0.33l-0.33,-44.15l86.62,0.33l0.33,88.29l42.81,0l0,87.96l-87.1,-0.15z"
  //   fill="#180D68" id="svg_7" />
  // <path d="m310.22,89.82l-44,-0.19l-0.67,-87.63l44.15,-0.67l0.52,88.48z" fill="#180D68" id="svg_8" />
  // </svg>`).replace('%address%', address).replace('%points%', points)
  if (!base64) return svgTemplate
  const svgBase64 = Buffer.from(svgTemplate).toString('base64')
  const svg = `data:image/svg+xml;base64,${svgBase64}`
  return svg
}


module.exports = { handler }
