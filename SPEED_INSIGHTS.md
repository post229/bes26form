# Vercel Speed Insights Configuration

This project has been configured with Vercel Speed Insights to track web performance metrics.

## What is Speed Insights?

Speed Insights automatically tracks web vitals and other performance metrics for your website, including:
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- First Contentful Paint (FCP)
- Time to First Byte (TTFB)

## How It Works

The `speed-insights.js` file initializes the Speed Insights tracking queue and loads the tracking script from Vercel's CDN. When the site is deployed on Vercel with Speed Insights enabled, the script will automatically collect performance data.

## Setup Instructions

To enable Speed Insights for this project:

1. **Deploy to Vercel** (if not already deployed)
   ```bash
   vercel deploy
   ```

2. **Enable Speed Insights in the Vercel Dashboard**
   - Go to your project in the Vercel Dashboard
   - Navigate to the "Speed Insights" tab
   - Click "Enable Speed Insights"

3. **Deploy again** (if needed)
   ```bash
   vercel --prod
   ```

4. **View Metrics**
   - After users visit your site, metrics will appear in the Speed Insights dashboard
   - Data typically starts appearing after a few hours of real user traffic

## Important Notes

- **No tracking in development**: Speed Insights does not track data when running locally or in development mode
- **Production only**: Data is only collected from production deployments
- **Real user monitoring**: Metrics are based on actual user experiences, not synthetic tests
- **Privacy**: Speed Insights does not collect personally identifiable information

## Package Information

- Package: `@vercel/speed-insights` version 1.3.1
- Installed via: npm
- Integration method: Vanilla JavaScript initialization script

## Documentation

For more information, see:
- [Vercel Speed Insights Documentation](https://vercel.com/docs/speed-insights)
- [Speed Insights Quickstart](https://vercel.com/docs/speed-insights/quickstart)
- [Speed Insights Package](https://vercel.com/docs/speed-insights/package)

## Troubleshooting

If Speed Insights is not working:

1. Verify that Speed Insights is enabled in the Vercel Dashboard
2. Check that the site is deployed to production on Vercel
3. Wait a few hours for data to populate after real users visit the site
4. Check the browser console for any errors (with `?debug=1` query parameter)
5. Verify the script is loading by checking the Network tab in browser DevTools

## Advanced Configuration

If you need to customize Speed Insights behavior, you can modify `speed-insights.js` to:

- Set a custom sample rate (e.g., track only 50% of page views)
- Add a `beforeSend` handler to filter or modify events
- Enable debug mode for development testing
- Configure custom routes for SPAs

See the [Speed Insights Package documentation](https://vercel.com/docs/speed-insights/package) for available options.
