import dotenv from 'dotenv';
import fetch from "isomorphic-fetch";
import { writeFileSync, readFileSync } from 'fs';

dotenv.config();

let file

async function getGithubStars(url, page = 1, previousContent = null) {
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
    await getGithubStars('https://api.github.com/users/azedo/starred', nextPage, file);
  } else {
    console.log(`Page ${page - 1} was the last valid page!`)
    console.log('Saving file...')
    await writeFileSync('./data.json', JSON.stringify(file))
    console.log('Done!')
  }
}

async function readGithubDataFile() {
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
      tags: ["github", it.language],
      created: it.created_at,
      pleaseParse: {}
    }))
  })
  console.log(`total = ${resParsed.length}`)
  await writeFileSync('./newData.json', JSON.stringify(resParsed))
}

async function createNewRainDrop() {
  const fetchUrl = 'https://api.raindrop.io/rest/v1/raindrop'
  const response = await fetch(fetchUrl, {
    method: "POST",
    headers: new Headers({
      "Authorization": `Bearer ${process.env.RAINDROP_TOKEN}`,
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({
      collectionId: 18455651,
      title: 'test',
      link: 'http://www.github.com',
      tags: ["github"],
      pleaseParse: {}
    })
  }).then(res => res.json());

  console.log(response.result ? 'Added!' : 'Something went wrong...')
}

async function createNewRainDrops() {
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

// getGithubStars('https://api.github.com/users/azedo/starred');
// readGithubDataFile()
createNewRainDrops()

