import { createListQuery } from "../utils/createListQuery"
import { loadGqlObjects } from "../utils/loadObjects"
import './me'
import './spot'
import './spots'
import './spotForecastsBySpot'
import './spotTimeline'

const NAME_FILTER_MODELS = new Set(['User', 'Location', 'Board'])
/** Custom visibility query in ./spots */
const SKIP_AUTO_LIST = new Set(['Spot'])

function registerAllQueries() {
  loadGqlObjects(ref => {
    if (!ref?.modelName) return
    if (SKIP_AUTO_LIST.has(ref.modelName)) return

    const name = ref.modelName as string
    const prismaKey = (name.charAt(0).toLowerCase() + name.slice(1)) as any
    const filterFields = NAME_FILTER_MODELS.has(ref.name)
      ? (t: any) => ({
          name: t.arg.string(),
        })
      : undefined

    createListQuery(prismaKey, ref, filterFields ? { filterFields } : undefined)
  });
}

registerAllQueries();
