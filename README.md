## Work assignment

Timebox: Aim for 4–8 hours. If you run out of time, include a "Next steps" section.

We are looking for a Senior Software Engineer to drive the development of AI/ML-powered features in ClickHouse Cloud. Given the current project, let's create an agentic experience for a SQL query editor. When opening the `/` the React application should render and display a SQL editor where we can write our natural language and SQL queries. For inspiration, you can sign up for a free trial in ClickHouse Cloud and experiment with the fully-featured SQL Console. This project is used as a conversation piece for the next stage of the interview process.

Implement the following features in TypeScript

- Using a LLM of your choice (local / OpenAI / Anthropic) input natural language to generate SQL queries
- Run single or multiple queries and display the query results in the UI
- Finish with a summary of the query and results

We encourage you to make this project _your own_ by being creative. Here are some ideas

- Streaming results
- Query diagnostics
- Next step recommendations after a query has run

Note:

We will not review the quality of the output of the LLM - just the integration work. If you use a 3rd party with API key, please provide instructions for the reviewer to obtain their own key - commercial models are fine. We have our [UI component library](https://click-ui.vercel.app) if you want some help with the components design that can give you some leverage and accelerate speed of development, but you are free to use whatever you would prefer. If you have any questions feel free to reach out to the hiring manager or recruiter. Feel free to use an agentic coding tool, but please let us know what you used and do not submit code you do not understand or can defend.

## Setup

- Requires docker and docker compose
- Requires Node 20+
- Requires TypeScript

`docker compose up -d`
`nvm use`
`npm i`

## Start the application

`npm run start`

## Test the application

`npm run test`
