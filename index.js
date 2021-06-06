import dotenv from 'dotenv';
import fetch from "isomorphic-fetch";
import { writeFileSync, readFileSync } from 'fs';

dotenv.config();

// Temporary variable to store github pages
let file

/**
 * First function - Get starred repos list
 *
 * @param {string} url
 * @param {number} [page=1]
 * @param {any | null} [previousContent=null]
 */
async function getGithubStarsList(url, page = 1, previousContent = null) {
  console.log(`Fetching page ${page}...`)

  const fetchUrl = `${url}?page=${page}`
  const content = await fetch(fetchUrl, {
    headers: new Headers({
      authorization: `token ${process.env.GITHUB_TOKEN}`
    })
  }).then(res => res.json());
  const contentLength = await content.length
  const shouldFetchAgain = contentLength > 0

  if (previousContent) {
    file = previousContent.concat(content)
  } else {
    file = content
  }

  if (shouldFetchAgain) {
    const nextPage = page + 1;
    await getGithubStarsList('https://api.github.com/users/azedo/starred', nextPage, file);
  } else {
    console.log(`Page ${page - 1} was the last valid page!`)
    console.log('Saving file...')
    await writeFileSync('./data.json', JSON.stringify(file))
    console.log('Done!')
  }
}

/**
 * Second function - Parse the github list file and add the necessary fields
 */
async function readAndParseGithubData() {
  const dataFile = readFileSync('./data.json', { encoding: 'utf-8' })
  const parsed = JSON.parse(dataFile)

  let total = parsed.length
  let count = parsed.length - 100
  let res = []

  while (total > 0) {
    const arrayContent = parsed.slice(count, total)

    if (arrayContent.length > 0) {
      res = res.concat([arrayContent])
    }

    total = total - 100
    count = count - 100
  }

  if (total > -100) {
    total = total + 100
    res = res.concat([parsed.slice(0, total)])
  }

  const resParsed = await res.map((item, i) => {
    console.log(`${i} = ${item.length}`)

    return item.map(it => ({
      collectionId: 18455651,
      title: it.full_name,
      link: it.html_url,
      tags: ["github", `${it.language}`],
      created: it.created_at,
      excerpt: it.description
    }))
  })
  console.log(`total = ${resParsed.length}`)
  await writeFileSync('./newData.json', JSON.stringify(resParsed))
}

/**
 * Create a single entry in the app
 *
 * @param {collectionId: number, title: string, link: string, tags: [string], created: any, description: string} item The item object
 */
async function createNewRainDrop(item) {
  const fetchUrl = 'https://api.raindrop.io/rest/v1/raindrop'

  let response = await fetch(fetchUrl, {
    method: "POST",
    headers: new Headers({
      "Authorization": `Bearer ${process.env.RAINDROP_TOKEN}`,
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(item)
  })

  response = await response.json()
  console.log(item.title, response.result ? 'Added!' : 'Something went wrong...')
}

/**
 * Loop the array and dispatch the post requests
 *
 * @param {[{collectionId: number, title: string, link: string, tags: [string], created: any, description: string}]} list
 * @param {number} [number=1]
 */
async function loopEntriesList(list, number = 1) {
  console.log(`===== Block #${number} start =====`)
  list.forEach(async entry => {
    try {
      await createNewRainDrop(entry)
    } catch (error) {
      console.log(error)
    }
  });
}

/**
 * Create a multiple entries via a loop of single post requests
 */
async function createNewRainDrops() {
  const dataFile = readFileSync('./newData.json', { encoding: 'utf-8' })
  const parsed = JSON.parse(dataFile)

  for (const [index, item] of parsed.entries()) {
    const time = index === 0 ? 0 : index * 1.5

    setTimeout(async () => {
      await loopEntriesList(item, index + 1)
    }, 60000 * time);
  }
}

/**
 * Create multiple entries at a time (max. supported 100 entries)
 * Note: It doesn't do the auto fetch of the description!
 */
async function createNewRainDropsMultiple() {
  const fetchUrl = 'https://api.raindrop.io/rest/v1/raindrops'
  const dataFile = readFileSync('./newData.json', { encoding: 'utf-8' })
  const parsed = JSON.parse(dataFile)

  for (const item of parsed) {
    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: new Headers({
        "Authorization": `Bearer ${process.env.RAINDROP_TOKEN}`,
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({ items: item })
    }).then(res => res.json());

    console.log(item.length, response.result ? 'Added!' : 'Something wrong happened...')
  }
}

// 1 - Fist run this function...
// getGithubStarsList('https://api.github.com/users/azedo/starred');

// 2 - Then run this one...
// readAndParseGithubData()

// 3 - And lastly, this one! (Choose the one that you prefer!)
// createNewRainDrops({
//   collectionId: number,
//   title: string,
//   link: string,
//   tags: [string],
//   created: Date,
//   excerpt: string
// }) // Single
// createNewRainDrops() // Multiple by single loop
// createNewRainDropsMultiple() // Multiple by 100's

// 4 - Now check your raindrops.io account and all the bookmarks should be there! ;)
// https://app.raindrop.io

// Note: For API documentation for raindrop.io -> https://developer.raindrop.io/
