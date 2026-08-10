import { useQueryClient } from '@tanstack/react-query'
import { Field, Form, Formik } from 'formik'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Yup from 'yup'
import { useAuth } from '../../auth/AuthContext'
import { FormField } from '../../components/forms/FormField'
import { FormSelect } from '../../components/forms/FormSelect'
import {
  CurrencyEnum,
  MarketplaceProductTypeEnum,
  useCreateMarketplaceListingMutation,
  useGetOffersQuery,
  useUpdateMyProfileMutation,
} from '../../generated/graphql'
import './MarketplacePage.css'

const productTypeOptions = Object.values(MarketplaceProductTypeEnum).map(
  (value) => ({
    value,
    label: value.charAt(0) + value.slice(1).toLowerCase(),
  }),
)

const currencyOptions = Object.values(CurrencyEnum).map((value) => ({
  value,
  label: value,
}))

const listingSchema = Yup.object({
  productType: Yup.mixed<MarketplaceProductTypeEnum>()
    .oneOf(Object.values(MarketplaceProductTypeEnum))
    .required('Type is required'),
  name: Yup.string().trim().required('Name is required'),
  brand: Yup.string().trim(),
  description: Yup.string().trim(),
  price: Yup.number().typeError('Price required').positive().required(),
  currency: Yup.mixed<CurrencyEnum>()
    .oneOf(Object.values(CurrencyEnum))
    .required(),
  length: Yup.number().nullable(),
  width: Yup.number().nullable(),
  thickness: Yup.number().nullable(),
  volume: Yup.number().nullable(),
  size: Yup.string().trim(),
})

const profileSchema = Yup.object({
  phone: Yup.string().trim(),
  location: Yup.string().trim(),
})

function formatMoney(price: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(price)
  } catch {
    return `${price} ${currency}`
  }
}

export function MarketplacePage() {
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<MarketplaceProductTypeEnum | ''>('')
  const [showSell, setShowSell] = useState(false)

  const offersQuery = useGetOffersQuery({
    take: 50,
    skip: 0,
    productType: filter || undefined,
  })
  const createListing = useCreateMarketplaceListingMutation({
    onSuccess: async () => {
      setShowSell(false)
      await offersQuery.refetch()
    },
  })
  const updateProfile = useUpdateMyProfileMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['Me'] })
    },
  })

  const offers = offersQuery.data?.offers ?? []
  const selected = useMemo(
    () => offers.find((offer) => offer.id === selectedId) ?? null,
    [offers, selectedId],
  )

  return (
    <div className="marketplace">
      <header className="marketplace__header">
        <div>
          <h1>Marketplace</h1>
          <p>Buy and sell boards, wetsuits, fins, and leashes. Contact sellers directly.</p>
        </div>
        <div className="marketplace__actions">
          {isAuthenticated ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowSell((v) => !v)}
            >
              {showSell ? 'Close' : 'Sell gear'}
            </button>
          ) : (
            <Link to="/" className="btn btn-secondary">
              Sign in to sell
            </Link>
          )}
        </div>
      </header>

      {isAuthenticated ? (
        <section className="marketplace__section">
          <h2>Your contact details</h2>
          <p className="marketplace__hint">
            Buyers see your phone and email when they open a listing.
          </p>
          <Formik
            enableReinitialize
            initialValues={{
              phone: user?.phone ?? '',
              location: user?.location ?? '',
            }}
            validationSchema={profileSchema}
            onSubmit={async (values, helpers) => {
              try {
                await updateProfile.mutateAsync({
                  phone: values.phone.trim() || undefined,
                  location: values.location.trim() || undefined,
                })
              } finally {
                helpers.setSubmitting(false)
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="marketplace__profile-form">
                <Field name="phone">
                  {({ field, form }: any) => (
                    <FormField
                      label="Phone"
                      placeholder="+55…"
                      field={field}
                      form={form}
                    />
                  )}
                </Field>
                <Field name="location">
                  {({ field, form }: any) => (
                    <FormField
                      label="Location"
                      placeholder="City / region"
                      field={field}
                      form={form}
                    />
                  )}
                </Field>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={isSubmitting || updateProfile.isPending}
                >
                  Save
                </button>
              </Form>
            )}
          </Formik>
        </section>
      ) : null}

      {showSell ? (
        <section className="marketplace__section">
          <h2>New listing</h2>
          <Formik
            initialValues={{
              productType: MarketplaceProductTypeEnum.Board,
              name: '',
              brand: '',
              description: '',
              price: '',
              currency: CurrencyEnum.Brl,
              length: '',
              width: '',
              thickness: '',
              volume: '',
              size: '',
            }}
            validationSchema={listingSchema}
            onSubmit={async (values, helpers) => {
              try {
                await createListing.mutateAsync({
                  data: {
                    productType: values.productType,
                    name: values.name.trim(),
                    brand: values.brand.trim() || undefined,
                    description: values.description.trim() || undefined,
                    price: Number(values.price),
                    currency: values.currency,
                    length: values.length === '' ? undefined : Number(values.length),
                    width: values.width === '' ? undefined : Number(values.width),
                    thickness:
                      values.thickness === ''
                        ? undefined
                        : Number(values.thickness),
                    volume:
                      values.volume === '' ? undefined : Number(values.volume),
                    size: values.size.trim() || undefined,
                  },
                })
                helpers.resetForm()
              } catch {
                // mutation error
              } finally {
                helpers.setSubmitting(false)
              }
            }}
          >
            {({ isSubmitting, values }) => (
              <Form className="marketplace__sell-form">
                <div className="marketplace__grid">
                  <Field name="productType">
                    {({ field, form }: any) => (
                      <FormSelect
                        label="Type"
                        required
                        options={productTypeOptions}
                        field={field}
                        form={form}
                      />
                    )}
                  </Field>
                  <Field name="currency">
                    {({ field, form }: any) => (
                      <FormSelect
                        label="Currency"
                        required
                        options={currencyOptions}
                        field={field}
                        form={form}
                      />
                    )}
                  </Field>
                  <Field name="name">
                    {({ field, form }: any) => (
                      <FormField label="Name" required field={field} form={form} />
                    )}
                  </Field>
                  <Field name="brand">
                    {({ field, form }: any) => (
                      <FormField label="Brand" field={field} form={form} />
                    )}
                  </Field>
                  <Field name="price">
                    {({ field, form }: any) => (
                      <FormField
                        label="Price"
                        type="number"
                        step="any"
                        required
                        field={field}
                        form={form}
                      />
                    )}
                  </Field>
                  {(values.productType === MarketplaceProductTypeEnum.Board ||
                    values.productType === MarketplaceProductTypeEnum.Leash) && (
                    <Field name="length">
                      {({ field, form }: any) => (
                        <FormField
                          label={
                            values.productType ===
                            MarketplaceProductTypeEnum.Board
                              ? 'Length (ft)'
                              : 'Length (ft)'
                          }
                          type="number"
                          step="any"
                          required={
                            values.productType ===
                            MarketplaceProductTypeEnum.Board
                          }
                          field={field}
                          form={form}
                        />
                      )}
                    </Field>
                  )}
                  {values.productType === MarketplaceProductTypeEnum.Board ? (
                    <>
                      <Field name="width">
                        {({ field, form }: any) => (
                          <FormField
                            label="Width (in)"
                            type="number"
                            step="any"
                            required
                            field={field}
                            form={form}
                          />
                        )}
                      </Field>
                      <Field name="thickness">
                        {({ field, form }: any) => (
                          <FormField
                            label="Thickness (in)"
                            type="number"
                            step="any"
                            required
                            field={field}
                            form={form}
                          />
                        )}
                      </Field>
                      <Field name="volume">
                        {({ field, form }: any) => (
                          <FormField
                            label="Volume (L)"
                            type="number"
                            step="any"
                            field={field}
                            form={form}
                          />
                        )}
                      </Field>
                    </>
                  ) : null}
                  {values.productType === MarketplaceProductTypeEnum.Wetsuit ? (
                    <>
                      <Field name="thickness">
                        {({ field, form }: any) => (
                          <FormField
                            label="Thickness (mm)"
                            type="number"
                            step="any"
                            required
                            field={field}
                            form={form}
                          />
                        )}
                      </Field>
                      <Field name="size">
                        {({ field, form }: any) => (
                          <FormField label="Size" field={field} form={form} />
                        )}
                      </Field>
                    </>
                  ) : null}
                  {values.productType === MarketplaceProductTypeEnum.Fins ? (
                    <Field name="size">
                      {({ field, form }: any) => (
                        <FormField label="Size" field={field} form={form} />
                      )}
                    </Field>
                  ) : null}
                  {values.productType === MarketplaceProductTypeEnum.Leash ? (
                    <Field name="thickness">
                      {({ field, form }: any) => (
                        <FormField
                          label="Thickness (mm)"
                          type="number"
                          step="any"
                          field={field}
                          form={form}
                        />
                      )}
                    </Field>
                  ) : null}
                </div>
                <Field name="description">
                  {({ field }: any) => (
                    <label className="form-field">
                      <span className="form-field__label">Description</span>
                      <textarea
                        {...field}
                        className="form-field__input"
                        rows={3}
                        placeholder="Condition, pickup area…"
                      />
                    </label>
                  )}
                </Field>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || createListing.isPending}
                  >
                    {isSubmitting || createListing.isPending
                      ? 'Publishing…'
                      : 'Publish offer'}
                  </button>
                  {createListing.isError ? (
                    <span className="form-status form-status--error">
                      {(createListing.error as Error).message}
                    </span>
                  ) : null}
                </div>
              </Form>
            )}
          </Formik>
        </section>
      ) : null}

      <section className="marketplace__section">
        <div className="marketplace__list-head">
          <h2>Offers</h2>
          <select
            className="marketplace__filter"
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as MarketplaceProductTypeEnum | '')
            }
          >
            <option value="">All types</option>
            {productTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {offersQuery.isLoading ? (
          <p>Loading offers…</p>
        ) : offers.length === 0 ? (
          <p>No offers yet.</p>
        ) : (
          <ul className="marketplace__list">
            {offers.map((offer) => {
              const open = selectedId === offer.id
              return (
                <li key={offer.id}>
                  <button
                    type="button"
                    className={`marketplace__card${open ? ' is-open' : ''}`}
                    onClick={() =>
                      setSelectedId((id) => (id === offer.id ? null : offer.id))
                    }
                  >
                    <div className="marketplace__card-top">
                      <strong>{offer.productLabel || offer.title || 'Gear'}</strong>
                      <span>{formatMoney(offer.price, offer.currency)}</span>
                    </div>
                    <div className="marketplace__card-meta">
                      {offer.productType.toLowerCase()} · {offer.user.name}
                      {offer.user.location ? ` · ${offer.user.location}` : ''}
                    </div>
                    {offer.description ? <p>{offer.description}</p> : null}
                  </button>
                  {open && selected ? (
                    <div className="marketplace__contact">
                      <h3>Contact seller</h3>
                      <p>
                        <strong>{selected.user.name}</strong>
                      </p>
                      <p>
                        Email:{' '}
                        <a href={`mailto:${selected.user.email}`}>
                          {selected.user.email}
                        </a>
                      </p>
                      <p>
                        Phone:{' '}
                        {selected.user.phone ? (
                          <a href={`tel:${selected.user.phone}`}>
                            {selected.user.phone}
                          </a>
                        ) : (
                          'Not provided'
                        )}
                      </p>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

export default MarketplacePage
