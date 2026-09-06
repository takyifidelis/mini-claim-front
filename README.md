# MiniClaim Frontend

Angular-based frontend for the Insurance Claim Management System. Built with Angular 22, NGXS, PrimeNG, and Bootstrap.

---

## Features

- **Claims Management**:
  - General Claims list with server-side pagination, search, and status filtering.
  - Claim Registration & Editing form with auto-computed estimated loss and cover validation.
  - Claims Review workflow for evaluating pending claims against policy cover limits.
  - Approved Payout processing and net payable calculation with deductible deduction.
  - Payment Settlement recording with payment method selection and transaction references.
  - Detailed Claim Breakdown with complete audit timeline, documents, and payment history.
- **Policy Management**:
  - Policies list with cover limits, deductible rates, policyholder details, and active status tracking.
  - Policy Registration and detail overview.
- **Risk Covers Catalogue**:
  - Configurable risk cover catalogue entries with active status indicators.
- **Exchange Rates**:
  - Multi-currency exchange rate catalogue (GHS, USD, EUR) supporting Bank of Ghana standards (4 decimal places).

---

## Tech Stack

- **Framework**: Angular v22 (Standalone components, Signals, Native control flow)
- **State Management**: NGXS (`@ngxs/store` v22)
- **UI Components**: PrimeNG v22 (Aura preset theme)
- **CSS / Layout**: Bootstrap 5.3 & custom SCSS modular styles
- **HTTP**: Angular `HttpClient` with functional `apiErrorInterceptor`

---

## Getting Started

### Prerequisites

- Node.js (v20+)
- npm (v10+)

### Installation

```bash
npm install
```

### Development Server

Run the development server:

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### Production Build

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

### Running Tests

```bash
ng test
```
