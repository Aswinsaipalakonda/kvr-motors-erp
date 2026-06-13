Act as a swarm of specialized senior engineers.

Your objective is to perform a complete audit of the entire application.

Analyze ALL source code, APIs, database schemas, mobile app screens, web dashboard pages, authentication flows, business logic, integrations, deployment configuration, and documentation.

Run the following agents independently and generate separate reports.

===================================
AGENT 1: ARCHITECTURE REVIEW
===================================

Review:

- Project structure
- Scalability
- Design patterns
- Technical debt
- Modularity
- Separation of concerns
- SOLID principles

Output:
- Critical Issues
- Major Issues
- Minor Issues
- Recommendations

===================================
AGENT 2: FRONTEND REVIEW
===================================

Review:

- React / Next.js code
- React Native / Expo code
- Component structure
- State management
- Routing
- Reusability
- Error handling
- Forms
- Responsiveness

Output:
- Bugs
- UI Issues
- Performance Issues
- Improvements

===================================
AGENT 3: UI REVIEW
===================================

Review:

- Visual consistency
- Typography
- Layouts
- Design system
- Colors
- Spacing
- Components

Output:
- UI inconsistencies
- Missing states
- Improvements

===================================
AGENT 4: UX REVIEW
===================================

Review:

- User journeys
- Navigation
- Accessibility
- Friction points
- Conversion blockers
- User flow

Output:
- UX issues
- Recommendations

===================================
AGENT 5: BACKEND REVIEW
===================================

Review:

- APIs
- Controllers
- Services
- Business logic
- Validation
- Error handling

Output:
- Bugs
- Security concerns
- Optimization opportunities

===================================
AGENT 6: DATABASE REVIEW
===================================

Review:

- Schema design
- Relationships
- Indexes
- Constraints
- RLS policies
- Query performance

Output:
- Schema issues
- Query issues
- Missing indexes
- Optimization suggestions

===================================
AGENT 7: API REVIEW
===================================

Review:

- REST endpoints
- Response formats
- Error handling
- Security
- Rate limiting
- Validation

Output:
- API issues
- Missing validations
- Improvements

===================================
AGENT 8: AUTHENTICATION REVIEW
===================================

Review:

- Login
- Registration
- Sessions
- JWT
- Permissions
- RBAC

Output:
- Vulnerabilities
- Improvements

===================================
AGENT 9: SECURITY REVIEW
===================================

Review:

- OWASP Top 10
- Secrets exposure
- SQL Injection
- XSS
- CSRF
- Authentication
- Authorization

Output:
- Security Report

===================================
AGENT 10: TESTING REVIEW
===================================

Review:

- Unit tests
- Integration tests
- E2E tests
- Coverage

Generate:
- Missing test cases
- Edge cases
- Test plan

===================================
AGENT 11: PERFORMANCE REVIEW
===================================

Review:

- Mobile performance
- Web performance
- Database performance
- API performance

Output:
- Bottlenecks
- Optimizations

===================================
AGENT 12: DEVOPS REVIEW
===================================

Review:

- Deployment
- Environment variables
- CI/CD
- Monitoring
- Logging

Output:
- DevOps improvements

===================================
FINAL REPORT
===================================

Combine all agent reports.

Generate:

1. Executive Summary
2. Critical Issues
3. High Priority Issues
4. Medium Priority Issues
5. Low Priority Issues
6. Security Score (1-10)
7. Performance Score (1-10)
8. Code Quality Score (1-10)
9. UX Score (1-10)
10. Production Readiness Score (1-10)

Finally create:

FIX_PRIORITY_LIST.md

ordered from highest business impact to lowest.




You are the **Orchestrator**. Execute the following plan.

===
PLAN
===

1. Run all 12 agents in parallel
2. Merge their reports
3. Generate final audit
4. Create FIX_PRIORITY_LIST.md

===
AGENTS
===

- ARCHITECTURE
- FRONTEND
- UI
- UX
- BACKEND
- DATABASE
- API
- AUTH
- SECURITY
- TESTING
- PERFORMANCE
- DEVOPS


Then run these 3 phases
Phase 1 — Static Audit

Run the prompt above.

This finds:

Bad code
Missing validation
Poor UX
Database issues
Security holes


## Phase 2 — Automated Testing Audit

After the report is generated:

Create automated test suites for the entire application.

Generate:

- Unit Tests
- Integration Tests
- API Tests
- Database Tests
- Authentication Tests
- Mobile App Tests
- Web Dashboard Tests
- Regression Tests

Run through every user flow and identify failures.


## Phase 3 — User Journey Testing

Act as 50 real users.

Test:

- Customer Journey
- Employee Journey
- Admin Journey
- Service Booking Journey
- Vehicle Purchase Journey
- CRM Journey

For each journey:

- List every click
- Expected result
- Actual result
- Friction points
- Bugs

Generate a complete usability report.