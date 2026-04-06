import { UserRef } from "../objects/User"
import { SpotRef } from "../objects/Spot"
import { createListQuery } from "../utils/createListQuery"

createListQuery('spot', SpotRef)
createListQuery('user', UserRef)