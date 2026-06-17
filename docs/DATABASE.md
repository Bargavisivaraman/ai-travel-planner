# Database Schema

PostgreSQL via Prisma. Full definition in [prisma/schema.prisma](../prisma/schema.prisma).

## Entity overview

```
User 1──* Trip 1──* City
                 1──* ItineraryDay 1──* Activity
                 1──* Expense
                 1──* PackingItem
                 1──* ChecklistItem
                 1──* Note
User 1──* FavoriteDestination
```

All child records cascade-delete with their parent trip, and all of a user's
data cascade-deletes with the user.

## Models

### User
| Field     | Type     | Notes                          |
| --------- | -------- | ------------------------------ |
| id        | String   | cuid, primary key              |
| name      | String?  |                                |
| email     | String   | unique                         |
| password  | String   | bcrypt hash                    |
| image     | String?  |                                |
| role      | Role     | `USER` or `ADMIN`              |
| createdAt | DateTime |                                |
| updatedAt | DateTime |                                |

### Trip
| Field       | Type        | Notes                                   |
| ----------- | ----------- | --------------------------------------- |
| id          | String      | cuid, primary key                       |
| userId      | String      | owner (FK to User)                      |
| title       | String      |                                         |
| description | String?     |                                         |
| coverImage  | String?     | image URL                               |
| startDate   | DateTime?   |                                         |
| endDate     | DateTime?   |                                         |
| budget      | Float       | default 0                               |
| currency    | String      | default `USD`                           |
| status      | TripStatus  | `PLANNING`, `BOOKED`, `COMPLETED`       |
| travelers   | Int         | default 1                               |
| isPublic    | Boolean     | controls public share page              |
| shareSlug   | String      | unique slug for `/share/<slug>`         |

### City
Multi-city stops: `name`, `country`, `arrivalDate`, `departureDate`, `lat`, `lng`, `order`, `notes`.

### ItineraryDay
A day in the schedule: `dayNumber`, `date`, `city`, `summary`. Has many Activity.

### Activity
A scheduled item: `time`, `title`, `description`, `location`, `type` (ActivityType), `cost`, `order`.

### Expense
`category`, `description`, `amount`, `date`.

### PackingItem
`name`, `category`, `quantity`, `packed`.

### ChecklistItem
`text`, `done`, `dueDate`.

### Note
`type` (NoteType), `title`, `content`, `location`, `createdAt`.

### FavoriteDestination
`name`, `country`, `notes`, `lat`, `lng`.

## Enums

- **Role**: `USER`, `ADMIN`
- **TripStatus**: `PLANNING`, `BOOKED`, `COMPLETED`
- **ActivityType**: `SIGHTSEEING`, `FOOD`, `TRANSPORT`, `HOTEL`, `FLIGHT`, `RELAX`, `OTHER`
- **NoteType**: `HOTEL`, `FLIGHT`, `ACTIVITY`, `LOCATION`, `GENERAL`

## Indexes

Foreign keys (`userId`, `tripId`, `dayId`) are indexed for query performance.
`User.email` and `Trip.shareSlug` are unique.

## Migrations

For local development, `npm run db:push` syncs the schema directly. For
production, generate versioned migrations with `npm run db:migrate` and apply
them with `npm run db:deploy` (`prisma migrate deploy`).
