import express from 'express'
import 'dotenv/config'

const app = express()
const port = process.env.PORT
const city: string = 'Paraiba'

interface CepInfo {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

let cepInfoArray: CepInfo[] = []

app.use(express.json())

app.get('/weather', async (request, response: express.Response) => {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPEN_WEATHER_KEY}`,
    )
    const dataJson = await res.json()
    response.json(dataJson)
  } catch (error) {
    console.error(error)
    response.status(400).end()
  }
})

async function getCep(requestBody: number | string) {
  const res = await fetch(`https://viacep.com.br/ws/${requestBody}/json/`)
  const dataJson = await res.json()
  const existingCepIndex = cepInfoArray.findIndex(
    (cep) => cep.cep.replace('-', '') === dataJson.cep.replace('-', ''),
  )
  if (existingCepIndex === -1) {
    cepInfoArray.push(dataJson)
  }
}

app.get(
  '/cep/:cep',
  async (request: express.Request, response: express.Response) => {
    try {
      const cepParams = request.params.cep
      await getCep(Number(cepParams))
      const infoCep = cepInfoArray.find(
        (cep) => cep.cep.replace('-', '') === cepParams,
      )
      response.json(infoCep)
    } catch (error) {
      console.error(error)
      response.status(400).end()
    }
  },
)

app.get('/cep', (request, response: express.Response) => {
  response.json(cepInfoArray)
})

app.post(
  '/cep',
  async (request: express.Request, response: express.Response) => {
    try {
      const body = request.body
      await getCep(body.cep)
      response.json(cepInfoArray)
      response.status(200)
    } catch (err) {
      console.error(err)
      response.status(400)
    }
  },
)

app.delete('/cep/:cep', (request, response) => {
  try {
    const cepParams: string = request.params.cep
    const cepIndex: number = cepInfoArray.findIndex(
      (cep) => cep.cep.replace('-', '') === cepParams,
    )
    if (cepIndex !== -1) {
      const cepToDelete = cepInfoArray.splice(cepIndex, 1)
      response.status(200).json(cepToDelete)
    }
  } catch (error) {
    console.error(error)
    response.status(400).end()
  }
})

app.put('/cep/:cep', async (request, response) => {
  try {
    const paramsCep = request.params.cep
    const body = request.body
    cepInfoArray = cepInfoArray.filter(
      (cep) => cep.cep.replace('-', '') !== paramsCep,
    )
    await getCep(body.cep)
    response.status(200).json(cepInfoArray)
  } catch (error) {
    console.error(error)
  }
})

app.listen(port, () => {
  console.log(`server rodando na porta ${port}`)
})
