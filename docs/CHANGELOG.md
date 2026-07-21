# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2026-07-21
### Added
- **General Ledger Filters**: Multi-criteria Filter Bar with keyword search, branch, category, payment mode, and date range filters with dynamic stat card recalculations.
- **Version Release Documentation**: Version release report created in `versions/v1.0.4.md`.

### Fixed
- **Mobile Responsive Cards**: Metric card grids updated across all role dashboards (`owner`, `supervisor`, `sales`, `staff`, `telecaller`) to display 2 cards per row on mobile with proper gap spacing and text overflow truncation.
- **Attendance Module**: Select-all checkbox fix, date/time column split, supervisor action controls, direct camera trigger (`capture="user"`), and high-accuracy GPS with permission prompts.
- **Supervisor Expenses & Deposits**: Replaced Recipient Supervisor with Depositor Name, and added Edit/Delete controls for Cash Deposits in Owner Expenses.
- **Supervisor Battery & Sales Customers**: Resolved battery stock creation and customer addition issues.
- **Notification Removal**: Completely removed notification system, bell icons, sidebar menu items, and dashboard tabs across all roles.
- **API & VPS Network Resilience**: Dynamic API base URL, try-catch resilience, and zero-downtime VPS deployment.

## [1.0.0] - 2026-06-11
### Added
- Integrated Ruflo Multi-Agent framework project directories and guidelines.
- Created `AGENTS.md` and `MASTER_PROMPT.md` at root.
- Added 12 specialized agent definitions and 22 core skill modules.
- Created standard templates in `docs/` for project lifecycle management.

