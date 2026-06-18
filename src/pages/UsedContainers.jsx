import { OfferView } from './OfferPage.jsx'
import { offerBySlug } from '../data/content.js'

export default function UsedContainers() {
  return <OfferView item={offerBySlug['kontenery-uzywane']} />
}
