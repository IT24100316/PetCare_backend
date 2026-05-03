# Boarding and Sitting API

This guide documents the Pet boarding and sitting backend features owned by the boarding module.

## Service Types

Both boarding and sitting are stored under `serviceType: "Boarding"` for compatibility with the existing booking routes. The new `careType` field identifies the actual service:

- `Boarding`: overnight care at the boarding facility.
- `Sitting`: daily pet sitting care.
