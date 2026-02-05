import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { etag } from 'hono/etag'

const app = new Hono()

// Apply CORS to all routes
app.use('*', cors({
  origin: 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

// Test route to verify backend and logging
app.get('/api/test', (c) => {
  console.log('Test route hit!');
  return c.json({ message: 'Backend is working!' });
})

// const getDB = async (c) => {
//   const data = await c.env.PHOTO_DB.get("index.json")
//   return JSON.parse(data || "{}")
// }

const getDB = async (c) => {
  try {
    const data = await c.env.PHOTO_DB.get("index_json")
    if (!data) {
      console.error("No data found in PHOTO_DB for key 'index_json'")
      return { groups: [], general: {} }
    }
    return JSON.parse(data)
  } catch (e) {
    console.error("Database read error:", e)
    return { groups: [], general: {} }
  }
}

app.get('/image/*', async (c) => {
  const path = c.req.param('0')

  console.log(path)

  const object = await c.env.images.get(path)

  if (!object) {
    return c.text('Image not found', 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, { headers })
})

//Get a single group with its photos//

app.get('/api/singlegroup', async (c)=> {
  const db = await getDB(c)
  const groupID = c.req.query('group')

  let groupData = db.groups.find(q => q.id === Number(groupID))
  return c.json(groupData)
})

//General API Calls//
app.get('/status', (c) => {
  return c.text({ status: 'Backend server is running!' })
})

//returns a list of all the categories
app.get('/api/categories', async (c) => {

  const db = await getDB(c)

  let categories = db.groups.map(g => { return g.category })
  let filteredCategories = categories.filter(e => e !== 'System')
  return c.json(filteredCategories)
})

//returns a list of all the groups within a category with their photos
app.get('/api/groups', async (c) => {
  const db = await getDB(c)
  let userCategory = c.req.query('category')

  if (userCategory) {
    let categoryGroups = db.groups.filter(g => g.category === userCategory)
    return c.json(categoryGroups)
  }

  return c.json(db.groups)
})

// app.get("/api/home-featured", async (c) => {
//   const db = await getDB()
//   let featured =
//     c.json(featured)
// })

//sends photos with certain ids
// app.post('/api/photos-id', async (c) => {
//   let ids = await c.req.json()
//   return c.json(photos)
// })

//Frontend Website API Calls//

app.post('api/add-general', async (c)=> {
  const db = await getDB(c)
  let generalContent = {
    "fontfamily": "'Arial', serif",
    "telephone": "8044890566",
    "email": "sdarmistead@gmail.com",
    "name": "Seth"
  }
  db.general = generalContent
  c.env.PHOTO_DB.put(JSON.stringify(db))
})

app.get("/api/system-data", async (c) => {
  const db = await getDB(c)
  return c.json(db.groups[0])
})

app.get("/api/general-settings", async (c) => {
  const db = await getDB(c)
  return c.json(db.general)
})

//Photographer Client API Calls//

//Update something in the index file
app.post('/api/update-index', async (c) => {
  const db = await getDB(c)
  const body = await c.req.json()

  db.general = { ...db.general, ...body }

  await c.env.PHOTO_DB.put('index.json', JSON.stringify(db))

  return c.json({ message: "Update Successful", updatedSettings: db.general })
})

//Add a new group
app.post("/api/new-group", async (c) => {
  const db = await getDB(c)
  const body = await c.req.json()
  const newGroup = {
    id: Date.now(),
    category: body.category,
    name: body.name,
    photos: [],
    coverphotoid: body.coverphotoid
  }

  db.groups.push(newGroup)

  await c.env.PHOTO_DB.put("index.json", JSON.stringify(db))

  return c.json({ message: `New group: ${body.name} added successfully!` })
})


//Gets the index from the backend
app.get('/api/index', async (c) => {
  const db = await getDB(c)
  return c.json(db)
})

export default app