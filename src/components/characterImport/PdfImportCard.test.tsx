import { render, screen } from '@testing-library/react'
import { PdfImportCard } from './PdfImportCard'

// Mock the upload handler
jest.mock('@/lib/uploadHandler', () => ({
  uploadPdfViaProxy: jest.fn(),
  getUploadThingToken: jest.fn(() => 'mock-token'),
  setUploadThingToken: jest.fn(),
}))

// Mock PDF.js
jest.mock('pdfjs-dist/webpack', () => ({
  GlobalWorkerOptions: {
    workerSrc: '/workers/pdf.worker.mjs'
  },
  getDocument: jest.fn()
}))

describe('PdfImportCard', () => {
  const mockProps = {
    onImportSuccess: jest.fn(),
    onImportError: jest.fn(),
    disabled: false,
    enableServerImport: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<PdfImportCard {...mockProps} />)
    
    expect(screen.getByText('PDF Character Import')).toBeInTheDocument()
    expect(screen.getByText('Choose File')).toBeInTheDocument()
    expect(screen.getByText('Upload')).toBeInTheDocument()
  })

  it('shows file selection input', () => {
    render(<PdfImportCard {...mockProps} />)
    
    const fileInput = screen.getByRole('button', { name: /choose file/i })
    expect(fileInput).toBeInTheDocument()
  })

  it('shows upload button', () => {
    render(<PdfImportCard {...mockProps} />)
    
    const uploadButton = screen.getByRole('button', { name: /upload/i })
    expect(uploadButton).toBeInTheDocument()
  })

  it('disables upload button when no file is selected', () => {
    render(<PdfImportCard {...mockProps} />)
    
    const uploadButton = screen.getByRole('button', { name: /upload/i })
    expect(uploadButton).toBeDisabled()
  })

  it('shows tabs when file is selected', () => {
    render(<PdfImportCard {...mockProps} />)
    
    // Initially, tabs should not be visible
    expect(screen.queryByText('PDF Preview')).not.toBeInTheDocument()
    expect(screen.queryByText('Text Sections')).not.toBeInTheDocument()
    expect(screen.queryByText('Field Mapping')).not.toBeInTheDocument()
  })
})
