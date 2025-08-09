// Load and display SWE-Bench results
async function loadResults() {
    try {
        const [resultsResponse, driversResponse] = await Promise.all([
            fetch('./data/swe-bench-results.json'),
            fetch('./data/underlying-drivers.json')
        ]);
        
        const resultsData = await resultsResponse.json();
        const driversData = await driversResponse.json();
        
        // Sort results by date
        const sortedResults = resultsData.results.sort((a, b) => new Date(a.date) - new Date(b.date));
        const sortedDrivers = driversData.drivers.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        displayChart(sortedResults, sortedDrivers);
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

function displayChart(results, drivers) {
    const ctx = document.getElementById('timeline-chart').getContext('2d');
    
    // Group data by model for different lines
    const modelData = {};
    
    // Company brand colors
    const brandColors = {
        'Claude Sonnet (Anthropic)': '#D97706', // Anthropic orange
        'Claude Opus (Anthropic)': '#B45309',   // Darker Anthropic orange  
        'Claude (Anthropic)': '#F59E0B',        // Light Anthropic orange
        'GPT (OpenAI)': '#10B981',              // OpenAI green
        'Gemini (Google)': '#4285F4',           // Google blue
        'SWE-agent (Princeton)': '#6366F1'      // Indigo
    };
    
    const defaultColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    results.forEach(result => {
        // Extract model family name
        let modelFamily = result.model_name;
        
        // Group similar models into families with sub-series
        if (modelFamily.includes('Claude')) {
            if (modelFamily.includes('Sonnet')) {
                modelFamily = 'Claude Sonnet';
            } else if (modelFamily.includes('Opus')) {
                modelFamily = 'Claude Opus';
            } else if (modelFamily.includes('Claude 2')) {
                modelFamily = 'Claude Sonnet'; // Claude 2 connects to Sonnet lineage
            } else {
                modelFamily = 'Claude Sonnet'; // Default other Claude models to Sonnet series
            }
        } else if (modelFamily.includes('GPT')) {
            modelFamily = 'GPT';
        } else if (modelFamily.includes('Gemini')) {
            modelFamily = 'Gemini';
        } else if (modelFamily.includes('SWE-agent')) {
            modelFamily = 'SWE-agent';
        }
        
        const modelKey = `${modelFamily} (${result.organization})`;
        if (!modelData[modelKey]) {
            modelData[modelKey] = [];
        }
        modelData[modelKey].push({
            x: result.date,
            y: result.score,
            modelName: result.model_name // Keep original name for tooltip
        });
    });
    
    // Sort data points by date for each model to ensure proper line connections
    Object.keys(modelData).forEach(modelKey => {
        modelData[modelKey].sort((a, b) => new Date(a.x) - new Date(b.x));
    });
    
    // Create datasets for each model
    const datasets = Object.keys(modelData).map((modelKey, index) => {
        const color = brandColors[modelKey] || defaultColors[index % defaultColors.length];
        return {
            label: modelKey,
            data: modelData[modelKey],
            borderColor: color,
            backgroundColor: color + '20',
            tension: 0.1,
            pointRadius: 5,
            pointHoverRadius: 8,
            fill: false,
            showLine: true
        };
    });

    // Add human performance baseline lines spanning full timeline
    const fullDateRange = ['2023-11-01', '2027-06-01'];
    
    // Expert human performance (estimated 80-90% on tasks designed for <1hr completion)
    datasets.push({
        label: 'Expert Human (estimated)',
        data: [
            { x: fullDateRange[0], y: 85 },
            { x: fullDateRange[1], y: 85 }
        ],
        borderColor: '#2C3E50',
        backgroundColor: 'transparent',
        borderDash: [10, 5],
        pointRadius: 0,
        tension: 0,
        fill: false,
        showLine: true
    });

    // Professional human performance (estimated 60-75%)
    datasets.push({
        label: 'Professional Human (estimated)',
        data: [
            { x: fullDateRange[0], y: 70 },
            { x: fullDateRange[1], y: 70 }
        ],
        borderColor: '#7F8C8D',
        backgroundColor: 'transparent',
        borderDash: [10, 5],
        pointRadius: 0,
        tension: 0,
        fill: false,
        showLine: true
    });

    // Novice human performance (estimated 30-45%)
    datasets.push({
        label: 'Novice Human (estimated)',
        data: [
            { x: fullDateRange[0], y: 40 },
            { x: fullDateRange[1], y: 40 }
        ],
        borderColor: '#BDC3C7',
        backgroundColor: 'transparent',
        borderDash: [10, 5],
        pointRadius: 0,
        tension: 0,
        fill: false,
        showLine: true
    });

    // Add underlying drivers data (normalized to 0-100 scale)
    // Compute capacity (normalized from 1e25 to 2e26 FLOPS -> 0-100)
    const computeData = drivers.map(d => ({
        x: d.date,
        y: Math.min(100, (d.compute_flops / 1e25 - 1) * 12.5) // Scale: 1e25 = 0, 2e26 = 100
    }));
    
    // Combine historical and future compute data into single FLOPS series
    const allDrivers = [...drivers]; // Include future roadmap data
    const allComputeData = allDrivers.map(d => ({
        x: d.date,
        y: Math.min(100, (Math.log10(d.compute_flops) - Math.log10(1e25)) / (Math.log10(1.2e27) - Math.log10(1e25)) * 100)
    }));
    
    datasets.push({
        label: 'FLOPS',
        data: allComputeData,
        borderColor: '#E74C3C',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 3,
        tension: 0.1,
        fill: false,
        showLine: true,
        yAxisID: 'y1'
    });

    // Context length unified timeline (historical + future projections)
    const allContextData = allDrivers.map(d => ({
        x: d.date,
        y: Math.min(100, (Math.log10(d.context_tokens) - Math.log10(8192)) / (Math.log10(50000000) - Math.log10(8192)) * 100)
    }));
    
    datasets.push({
        label: 'Context Length (tokens)',
        data: allContextData,
        borderColor: '#9B59B6',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 3,
        tension: 0.1,
        fill: false,
        showLine: true,
        yAxisID: 'y1'
    });

    // Calculate correlations and add projections
    const correlationAnalysis = calculateCorrelations(results, drivers);
    const projections = generateProjections(correlationAnalysis, drivers);
    
    // Add projection datasets
    projections.forEach(projection => {
        datasets.push(projection);
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        parser: 'yyyy-MM-dd',
                        displayFormats: {
                            day: 'MMM dd',
                            month: 'MMM yyyy'
                        }
                    },
                    min: '2023-11-01',
                    max: '2027-06-01',
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'SWE-bench Score (%)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Underlying Drivers (normalized)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'SWE-Bench Model Performance Over Time'
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const dataPoint = context.raw;
                            return dataPoint.modelName ? `Model: ${dataPoint.modelName}` : '';
                        }
                    }
                },
                annotation: {
                    annotations: {
                        expertLabel: {
                            type: 'label',
                            xValue: '2024-03-01',
                            yValue: 85,
                            content: 'Expert Human',
                            backgroundColor: 'rgba(44, 62, 80, 0.8)',
                            color: 'white',
                            font: {
                                size: 11
                            },
                            padding: 4,
                            borderRadius: 3
                        },
                        professionalLabel: {
                            type: 'label',
                            xValue: '2024-03-01',
                            yValue: 70,
                            content: 'Professional Human',
                            backgroundColor: 'rgba(127, 140, 141, 0.8)',
                            color: 'white',
                            font: {
                                size: 11
                            },
                            padding: 4,
                            borderRadius: 3
                        },
                        noviceLabel: {
                            type: 'label',
                            xValue: '2024-03-01',
                            yValue: 40,
                            content: 'Novice Human',
                            backgroundColor: 'rgba(189, 195, 199, 0.8)',
                            color: 'white',
                            font: {
                                size: 11
                            },
                            padding: 4,
                            borderRadius: 3
                        },
                        claudeSonnetLabel: {
                            type: 'label',
                            xValue: '2025-03-01',
                            yValue: 72,
                            content: 'Claude Sonnet',
                            backgroundColor: 'rgba(217, 119, 6, 0.9)',
                            color: 'white',
                            font: {
                                size: 11,
                                weight: 'bold'
                            },
                            padding: 4,
                            borderRadius: 3
                        },
                        claudeOpusLabel: {
                            type: 'label',
                            xValue: '2025-06-01',
                            yValue: 74,
                            content: 'Claude Opus',
                            backgroundColor: 'rgba(180, 83, 9, 0.9)',
                            color: 'white',
                            font: {
                                size: 11,
                                weight: 'bold'
                            },
                            padding: 4,
                            borderRadius: 3
                        },
                        gptLabel: {
                            type: 'label',
                            xValue: '2025-07-01',
                            yValue: 65,
                            content: 'GPT',
                            backgroundColor: 'rgba(16, 185, 129, 0.9)',
                            color: 'white',
                            font: {
                                size: 11,
                                weight: 'bold'
                            },
                            padding: 4,
                            borderRadius: 3
                        },
                        geminiLabel: {
                            type: 'label',
                            xValue: '2025-04-01',
                            yValue: 53,
                            content: 'Gemini',
                            backgroundColor: 'rgba(66, 133, 244, 0.9)',
                            color: 'white',
                            font: {
                                size: 11,
                                weight: 'bold'
                            },
                            padding: 4,
                            borderRadius: 3
                        },
                        flopsLabel: {
                            type: 'label',
                            xValue: '2025-12-01',
                            yValue: 70,
                            content: 'FLOPS',
                            backgroundColor: 'rgba(231, 76, 60, 0.9)',
                            color: 'white',
                            font: {
                                size: 10,
                                style: 'italic'
                            },
                            padding: 3,
                            borderRadius: 3
                        },
                        contextLabel: {
                            type: 'label',
                            xValue: '2026-09-01',
                            yValue: 80,
                            content: 'Context Length',
                            backgroundColor: 'rgba(155, 89, 182, 0.9)',
                            color: 'white',
                            font: {
                                size: 10,
                                style: 'italic'
                            },
                            padding: 3,
                            borderRadius: 3
                        },
                        projectionLabel: {
                            type: 'label',
                            xValue: '2026-12-01',
                            yValue: 95,
                            content: 'Opus Projection',
                            backgroundColor: 'rgba(180, 83, 9, 0.7)',
                            color: 'white',
                            font: {
                                size: 10,
                                style: 'italic'
                            },
                            padding: 3,
                            borderRadius: 3
                        }
                    }
                }
            },
            interaction: {
                intersect: true,
                mode: 'point'
            }
        }
    });
}

function calculateCorrelations(results, drivers) {
    // Match performance data with driver data by date proximity
    const matchedData = [];
    
    results.forEach(result => {
        const resultDate = new Date(result.date);
        // Find closest driver data point (within 30 days)
        const closestDriver = drivers.find(driver => {
            const driverDate = new Date(driver.date);
            const daysDiff = Math.abs(driverDate - resultDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 30;
        });
        
        if (closestDriver) {
            matchedData.push({
                performance: result.score,
                compute: closestDriver.compute_flops,
                contextTokens: closestDriver.context_tokens,
                date: result.date,
                model: result.model_name
            });
        }
    });
    
    // Calculate correlations (Pearson correlation coefficient)
    const computeCorr = calculatePearsonCorrelation(
        matchedData.map(d => Math.log10(d.compute)),
        matchedData.map(d => d.performance)
    );
    
    const contextCorr = calculatePearsonCorrelation(
        matchedData.map(d => Math.log10(d.contextTokens)),
        matchedData.map(d => d.performance)
    );
    
    console.log('Compute-Performance Correlation:', computeCorr.toFixed(3));
    console.log('Context-Performance Correlation:', contextCorr.toFixed(3));
    
    return {
        computeCorrelation: computeCorr,
        contextCorrelation: contextCorr,
        matchedData: matchedData
    };
}

function calculatePearsonCorrelation(x, y) {
    const n = x.length;
    if (n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

function generateProjections(analysis, drivers) {
    const projections = [];
    
    // Get future drivers from the roadmap (already includes Nvidia roadmap data)
    const futureDrivers = drivers.filter(d => new Date(d.date) > new Date());
    
    if (futureDrivers.length === 0) return projections;
    
    // Create Claude Opus-specific projection based on compute and context scaling
    // Start with current Claude 4.1 Opus performance to connect seamlessly
    const opusProjection = [
        {
            x: '2025-08-15', // Claude 4.1 Opus current date
            y: 74.5 // Current performance
        }
    ];
    
    // Add future projections
    const futureOpusProjections = futureDrivers.map(driver => {
        // Use Claude 4.1 Opus (74.5%) as baseline for projection
        const basePerformance = 74.5;
        const currentDate = new Date('2025-08-15'); // Claude 4.1 Opus date
        const projectionDate = new Date(driver.date);
        const monthsAhead = (projectionDate - currentDate) / (1000 * 60 * 60 * 24 * 30);
        
        // Compute scaling factor (log scale)
        const logCompute = Math.log10(driver.compute_flops);
        const baseLogCompute = Math.log10(2.0e26); // Current Opus baseline
        const computeBoost = (logCompute - baseLogCompute) * 8; // Compute scaling effect
        
        // Context length scaling factor (log scale)
        const logContext = Math.log10(driver.context_tokens);
        const baseLogContext = Math.log10(1000000); // Current context baseline
        const contextBoost = (logContext - baseLogContext) * 5; // Context scaling effect
        
        // Combined effect with diminishing returns
        const totalBoost = computeBoost + contextBoost;
        const projectedPerformance = basePerformance + (100 - basePerformance) * (1 - Math.exp(-totalBoost / 10));
        
        return {
            x: driver.date,
            y: Math.min(99, projectedPerformance) // Cap at 99%
        };
    });
    
    // Combine current point with projections
    opusProjection.push(...futureOpusProjections);
    
    projections.push({
        label: 'Claude Opus Projection',
        data: opusProjection,
        borderColor: '#B45309', // Darker Anthropic orange
        backgroundColor: '#B45309',
        borderDash: [2, 4],
        pointRadius: 2,
        pointHoverRadius: 4,
        pointStyle: 'circle',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        showLine: true
    });
    
    return projections;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatBenchmark(benchmark) {
    return benchmark
        .replace('swe-bench-', '')
        .replace('-', ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

function formatMethod(method) {
    return method
        .replace('-', ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Initialize the app
document.addEventListener('DOMContentLoaded', loadResults);