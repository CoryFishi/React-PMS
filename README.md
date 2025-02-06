# React Property Management Solution

## Description

Ability to add companies, facilities, units, tenants.

## Installation

```bash
# Clone the repository
git clone https://github.com/coryfishi/React-PMS.git

# Change directory
cd server

# Install dependencies
npm install

# Change directory
cd ../client

# Install dependencies
npm install

```

## Usage

```bash

npm run dev

```

## Features

List the key features of your project.

- Top-down management from company to tenant
- Fluid expansion of services with no intervention by source company
- 1 service for total facility management

## To-Do

- [ ] Task 1: Description of task 1
- [ ] Task 2: Description of task 2
- [ ] Task 3: Description of task 3

## Completed

- [x] Task 1: Description of task 1
- [x] Task 2: Description of task 2
- [x] Task 3: Description of task 3

## Contributing

Contributions are currently not public, however feel free to reach out me directly with any questions or inquiries.

## Contact

Contact me directly with any inquiry or questions via email.

coryfishburnjr@gmail.com

# Needed features

- API endpoint for the admin and facility dashboards so their is only 1 call to the server and not 5+ on mount.
- Better colors for the dashboards
- Automations to import multiple user, companies, facilities, units, tenants.
- Company_Admin & Company_User restricted access dashboard
- Facility unit map
- Previous tenants table
- Facility Dashboard
- Gate Integration Setting/Reporting
- Tenant Payments
- Tenant Lease
- Tenant Isurance
- Facility level settings
- remove security level from unit layer

# Current Bugs

- When creating multiple units at one time it will submit all but the 1 with an error then when the error is resolved it will say it is already created.
- Navbar user dropdown does not go away on out of box clicking
- Facility Application Events report, error on api call
