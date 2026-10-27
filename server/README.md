# Server configuration

## Employer application review

Employer signups remain pending until a configured admin reviews the company
name and website in the admin employer queue. Add one or more existing JobHub
account emails to the server environment:

```env
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

Log in with one of those accounts to open `/admin/employers`. Admin authorization
is checked against the server-side email allowlist, not a client-supplied role.
New employer accounts cannot post jobs, view applicant pipelines, or use company
management tools while pending or rejected. Employers approved before this gate
was introduced remain active.

## SMS job alerts

Saved-search alerts are sent through Africa's Talking when an employer posts an
active job. Seekers must save a search, add a Kenyan mobile number, and
explicitly enable SMS alerts in Settings.

Configure these server environment variables to enable delivery:

```env
AT_USERNAME=your_africas_talking_username
AT_API_KEY=your_africas_talking_api_key
AT_ENV=sandbox
# Optional; omit to use the account's default sender.
AT_SENDER_ID=
```

Set `AT_ENV` to `sandbox` for sandbox testing or `production` (or omit it) for
the production endpoint. Keep the API key private and do not commit it. The
existing `CLIENT_URL` setting is used to include a job link in each alert.
Without `AT_USERNAME` and `AT_API_KEY`, SMS opt-in remains unavailable; saved
searches can still be created and managed.

## Job matching skills

Employers can add comma- or newline-separated required and preferred skills to
a job post. Required skills make up 80% of the match's skill component when
preferred skills are also supplied; preferred skills make up the remaining
20%. When no structured skills are listed, the matcher falls back to skills
detected in the job description.
