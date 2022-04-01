import { writePackage } from 'write-pkg'
import { readPackage } from 'read-pkg'

const opts = { normalize: false }
const json = await readPackage(opts)

await writePackage({ ...json, name: `immerx-patchdiff` })
