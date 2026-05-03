# Boarding and Sitting API

This guide documents the Pet boarding and sitting backend features owned by the boarding module.

## Service Types

Both boarding and sitting are stored under `serviceType: "Boarding"` for compatibility with the existing booking routes. The new `careType` field identifies the actual service:

- `Boarding`: overnight care at the boarding facility.
- `Sitting`: daily pet sitting care.

## Rates

Rates are calculated on the backend to avoid trusting frontend totals.

- Boarding daily rate: `2500`
- Sitting daily rate: `1800`

`totalPrice` is calculated as `dailyRate * boardingDates.length`.

## Booking Data

Boarding and sitting bookings can store the following care details:

- `dropOffTime`
- `pickUpTime`
- `feedingInstructions`
- `medicationInstructions`
- `emergencyContactName`
- `emergencyContactPhone`
- `specialCareNotes`
- `notes`

## Get Services

`GET /api/bookings/boarding/services`

Returns the supported care types, their daily rates, and the daily facility capacity. Use this endpoint to render service cards or price previews in the frontend.

## Check Availability

`GET /api/bookings/boarding/available?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

Returns one item per date with `count`, `capacity`, `remainingCapacity`, and `status`. A date becomes `full` when approved bookings reach the configured capacity.

## Create Booking

`POST /api/bookings/boarding/book`

Required fields are `petId`, `careType`, and `boardingDates`. The backend verifies pet ownership, rejects past start dates, prevents duplicate active dates for the same pet, and calculates the price.

## Update Pending Booking

`PATCH /api/bookings/boarding/:id/update`

Users can update dates, care type, and care instructions while the booking is still `Pending`. Approved, rejected, and cancelled bookings cannot be edited from this endpoint.

## Cancel Booking

`DELETE /api/bookings/boarding/:id`

Users can cancel their own future boarding or sitting bookings. The endpoint rejects cancellation once the first booking day has already started.

## Pet Booked Dates

`GET /api/bookings/boarding/pet-dates?petId=PET_ID`

Returns active `Pending` and `Approved` dates for the selected pet. Each item includes the date, status, and care type so the UI can mark unavailable calendar dates.

## Manager Booking List

`GET /api/bookings/boarding`

Boarding managers and admins can filter by `status`, `careType`, `startDate`, and `endDate`. Results include populated pet and user details for dashboard review.

## Manager Summary

`GET /api/bookings/boarding/summary`

Returns capacity, upcoming approved booking count, status totals, and approved revenue grouped by care type.
