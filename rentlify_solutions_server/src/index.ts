import './config/load-environment.js'

import { createApplication } from './app.js'
import { environment } from './config/environment.js'

const application = createApplication()

application.listen(environment.PORT, () => {
  console.info(`Rentlify Solutions server is running on port ${environment.PORT}.`)
})
