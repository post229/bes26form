/**
 * Vercel Speed Insights initialization
 * This script initializes the Speed Insights queue and loads the tracking script.
 * 
 * For this to work:
 * 1. The project must be deployed on Vercel
 * 2. Speed Insights must be enabled in the Vercel dashboard
 * 
 * Learn more: https://vercel.com/docs/speed-insights/quickstart
 */

(function() {
  'use strict';
  
  // Initialize the Speed Insights queue
  // This allows tracking calls to be queued before the main script loads
  window.si = window.si || function () { 
    (window.siq = window.siq || []).push(arguments); 
  };
  
  // Load the Speed Insights script
  // When deployed on Vercel with Speed Insights enabled, this script will be served automatically
  var script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/speed-insights/script.js';
  
  // Add dataset attributes for tracking
  script.setAttribute('data-sdkn', '@vercel/speed-insights');
  script.setAttribute('data-sdkv', '1.3.1');
  
  // Append the script to the document head
  if (document.head) {
    document.head.appendChild(script);
  }
})();
