import { createListQuery } from "../utils/createListQuery"
import { loadGqlObjects } from "../utils/loadObjects"

function registerAllQueries() {
  loadGqlObjects(ref => {
    const name = ref.modelName;
    createListQuery(name, ref);
  });
}

registerAllQueries();
// createListQuery('spot', SpotRef)
