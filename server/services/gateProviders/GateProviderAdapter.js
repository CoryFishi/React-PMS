/**
 * Gate provider adapter contract.
 *
 * Each concrete adapter (openTechAdapter, nokeAdapter, etc.) exports a default
 * object matching this shape. gateService dispatches to the adapter chosen by
 * Facility.gateProvider.
 *
 * @typedef {Object} GateTimeGroup
 * @property {string} id
 * @property {string} name
 * @property {boolean} isDefault
 *
 * @typedef {Object} GateAccessProfile
 * @property {string} id
 * @property {string} name
 * @property {boolean} isDefault
 *
 * @typedef {Object} GateProvisionInput
 * @property {Object} facility   - StorageFacility doc (with company populated)
 * @property {Object} rental     - Rental doc
 * @property {Object} tenant     - Tenant doc
 * @property {string} accessCode - access code chosen by gateService
 *
 * @typedef {Object} GateProviderAdapter
 * @property {(input: GateProvisionInput) => Promise<{ visitorId: string }>} provisionTenant
 * @property {(input: { facility: Object, rental: Object, unit: Object }) => Promise<void>} revokeTenant
 * @property {(input: { facility: Object, unit: Object }) => Promise<void>} suspendUnit
 * @property {(input: { facility: Object, unit: Object }) => Promise<void>} unsuspendUnit
 * @property {(input: { facility: Object }) => Promise<GateTimeGroup[]>} listTimeGroups
 * @property {(input: { facility: Object }) => Promise<GateAccessProfile[]>} listAccessProfiles
 * @property {(input: { facility: Object }) => Promise<{ ok: boolean, error?: string }>} healthCheck
 */

export {};
