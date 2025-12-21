import { ReactNode } from "react"

/**
 * Generic Admin CRUD Table - Configuration Types
 * 
 * This defines the contract for creating admin CRUD tables with minimal repetition.
 * Supports both Cloud Functions and direct Firestore service patterns.
 */

// Base entity must have an id
export interface BaseEntity {
    id: string
    [key: string]: unknown
}

// Column definition for table display
export interface ColumnConfig<T> {
    key: keyof T | string
    label: string
    render?: (item: T) => ReactNode
    className?: string
}

// Filter configuration
export interface FilterConfig {
    key: string
    label: string
    options: Array<{ value: string; label: string }>
    getValue?: <T>(item: T) => string
}

// Service interface for CRUD operations
export interface CrudService<T> {
    getAll: () => Promise<T[]>
    add: (data: Omit<T, 'id'>) => Promise<void>
    update: (id: string, data: Partial<T>) => Promise<void>
    delete: (id: string) => Promise<void>
    seed?: () => Promise<void>
}

// Cloud Functions operations (alternative to service)
export interface CloudFunctionsConfig {
    saveFunctionName: string
    deleteFunctionName: string
}

// Main configuration for AdminCrudTable
export interface AdminCrudConfig<T extends BaseEntity> {
    // Display
    entityName: string // "Meeting", "Sober Living Home", "Quote"
    entityNamePlural: string // "Meetings", "Homes", "Quotes"

    // Data source (one of these must be provided)
    service?: CrudService<T>
    cloudFunctions?: CloudFunctionsConfig
    collectionName?: string // For Cloud Functions, also used for direct fetching

    // Table configuration
    columns: ColumnConfig<T>[]
    searchFields: Array<keyof T>
    filters?: FilterConfig[]

    // Form component
    FormComponent: React.ComponentType<{
        formData: Partial<T>
        setFormData: (data: Partial<T>) => void
        isEditing: boolean
    }>

    // Optional features
    showResetButton?: boolean
    resetData?: () => Promise<void>
    emptyFormData: Omit<T, 'id'>

    // Validation
    validateForm?: (data: Partial<T>) => string | null // Returns error message or null
}
