# NanoScrape

Public source of the [nanoscrape.com](https://www.nanoscrape.com) website plus free automation templates and tutorials for the NanoScrape actor family on Apify.

NanoScrape builds lightweight HTTP-only web scrapers (mostly Go, no browser) that run on [Apify](https://apify.com/santamaria-automations). Our actors are typically **10 to 50x cheaper** than browser-based alternatives because we do not launch Chrome. Datacenter proxies, sub-second cold starts, ~12 to 80 MB Docker images.

## Tutorials

Step-by-step guides for turning NanoScrape actors into working automations in n8n, Make, or Zapier. Every tutorial comes with a downloadable workflow template.

| Tutorial | Automation | Destination | Actor |
|---|---|---|---|
| [How to Scrape Google Maps with n8n](https://www.nanoscrape.com/tutorials/scrape-google-maps-with-n8n/) | n8n | Google Sheets | [google-maps-scraper](https://apify.com/santamaria-automations/google-maps-scraper) |

Browse all tutorials at [nanoscrape.com/tutorials](https://www.nanoscrape.com/tutorials/).

## Templates

Ready-to-import workflows for popular automation tools. Download the JSON, paste your API tokens, run.

### n8n

| Template | What it does | Related actor |
|---|---|---|
| [scrape-google-maps-to-google-sheets.json](./templates/n8n/scrape-google-maps-to-google-sheets.json) | Search Google Maps and append 30+ fields per business into a Google Sheet | [google-maps-scraper](https://apify.com/santamaria-automations/google-maps-scraper) |

### Make (Integromat)

Coming soon. Want a specific one built next? Email [contact@nanoscrape.com](mailto:contact@nanoscrape.com).

### Zapier

Coming soon. Want a specific one built next? Email [contact@nanoscrape.com](mailto:contact@nanoscrape.com).

Browse all templates at [nanoscrape.com/templates](https://www.nanoscrape.com/templates/).

## Actors

The full NanoScrape actor catalog lives on Apify:

- [All NanoScrape actors on Apify](https://apify.com/santamaria-automations)
- [Google Maps Scraper](https://apify.com/santamaria-automations/google-maps-scraper) - business data at $1 per 1,000 places
- [Reed.co.uk Scraper](https://apify.com/santamaria-automations/reed-uk-scraper) - UK job listings, HTTP-only Go, ~$0.80 per 1,000 results
- [Indeed Scraper](https://apify.com/santamaria-automations/indeed-scraper) - global jobs, mobile pagination bypass
- [Google Search Scraper](https://apify.com/santamaria-automations/google-search-scraper) - SERPs, ~$1 per 1,000 queries
- [Website Contact Extractor](https://apify.com/santamaria-automations/website-contact-extractor) - AI-powered team contact extraction from any website
- [Website Job Extractor](https://apify.com/santamaria-automations/website-job-extractor) - AI-powered career-page scraping

Each actor's individual landing page (with pricing, specs, output fields, and use cases) is at `https://www.nanoscrape.com/actors/<actor-slug>/`.

## Contributing a template or tutorial

Have an n8n / Make / Zapier workflow you would like to share? Or a tutorial that uses a NanoScrape actor? Open a pull request against this repo or email [contact@nanoscrape.com](mailto:contact@nanoscrape.com) and we will feature it (with credit).

## About

NanoScrape is built and maintained by [Alessandro Santamaria](https://alessandrosantamaria.com). The thesis: most scraping targets do not need a browser. When you can solve a target with HTTP + TLS fingerprinting + a well-picked proxy, your Docker image is 12 MB instead of 500 MB, your run costs pennies instead of dollars, and your infrastructure is boring and reliable.

Contact: [contact@nanoscrape.com](mailto:contact@nanoscrape.com)
Bug reports and feature requests: use the Issues tab on the relevant actor in Apify Console.
