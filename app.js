const { createApp, ref, reactive, computed, onMounted } = Vue;

const app = createApp({
    setup() {
        // 图表类型
        const chartTypes = [
            { 
                type: 'bar', 
                name: '柱状图', 
                icon: 'fas fa-chart-bar', 
                description: '显示数据的大小对比关系' 
            },
            { 
                type: 'line', 
                name: '折线图', 
                icon: 'fas fa-chart-line', 
                description: '展示数据随时间的变化趋势' 
            },
            { 
                type: 'pie', 
                name: '饼图', 
                icon: 'fas fa-chart-pie', 
                description: '展示数据的占比情况' 
            },
            { 
                type: 'doughnut', 
                name: '环形图', 
                icon: 'fas fa-circle', 
                description: '类似饼图，中间有空白' 
            },
            { 
                type: 'radar', 
                name: '雷达图', 
                icon: 'fas fa-spider', 
                description: '多维度数据比较' 
            },
            { 
                type: 'polarArea', 
                name: '极区图', 
                icon: 'fas fa-sun', 
                description: '结合饼图和雷达图特点' 
            }
        ];

        // 状态变量
        const selectedChartType = ref('');
        const labels = ref('');
        const dataValues = ref('');
        const backgroundColors = ref('');
        const datasetLabel = ref('');
        const xAxisLabel = ref('');
        const yAxisLabel = ref('');
        const chartGenerated = ref(false);
        const isFullscreen = ref(false);
        
        // 统计数据
        const statistics = reactive({
            sum: 0,
            average: 0,
            max: 0,
            min: 0,
            median: 0,
            stdDev: 0
        });

        // 当前图表实例
        let currentChart = null;
        let fullscreenChart = null;
        
        // 图表配置
        let chartConfig = null;

        // 选择图表类型
        const selectChartType = (type) => {
            selectedChartType.value = type;
            
            // 设置一些默认值
            if (type === 'bar' || type === 'line') {
                if (!labels.value) labels.value = '一月,二月,三月,四月,五月,六月';
                if (!dataValues.value) dataValues.value = '12,19,3,17,28,24';
                if (!datasetLabel.value) datasetLabel.value = '销售数据';
                if (!xAxisLabel.value) xAxisLabel.value = '月份';
                if (!yAxisLabel.value) yAxisLabel.value = '销售额';
            } else if (type === 'pie' || type === 'doughnut') {
                if (!labels.value) labels.value = '红队,蓝队,绿队,黄队';
                if (!dataValues.value) dataValues.value = '25,40,20,15';
                if (!backgroundColors.value) backgroundColors.value = '#FF6384,#36A2EB,#4BC0C0,#FFCE56';
            } else if (type === 'radar') {
                if (!labels.value) labels.value = '攻击,防御,速度,生命,魔法';
                if (!dataValues.value) dataValues.value = '65,59,90,81,56';
                if (!datasetLabel.value) datasetLabel.value = '能力值';
            } else if (type === 'polarArea') {
                if (!labels.value) labels.value = '市场份额,用户满意度,增长率,投资回报';
                if (!dataValues.value) dataValues.value = '70,85,65,90';
                if (!backgroundColors.value) backgroundColors.value = 'rgba(255,99,132,0.7),rgba(54,162,235,0.7),rgba(255,206,86,0.7),rgba(75,192,192,0.7)';
            }
        };

        // 计算统计数据
        const calculateStatistics = (data) => {
            const numericData = data.map(Number);
            
            // 总和
            statistics.sum = _.sum(numericData).toFixed(2);
            
            // 平均值
            statistics.average = _.mean(numericData).toFixed(2);
            
            // 最大值
            statistics.max = _.max(numericData).toFixed(2);
            
            // 最小值
            statistics.min = _.min(numericData).toFixed(2);
            
            // 中位数
            statistics.median = _.sortBy(numericData)[Math.floor(numericData.length / 2)].toFixed(2);
            
            // 标准差
            const mean = _.mean(numericData);
            const squareDiffs = numericData.map(value => {
                const diff = value - mean;
                return diff * diff;
            });
            const avgSquareDiff = _.mean(squareDiffs);
            statistics.stdDev = Math.sqrt(avgSquareDiff).toFixed(2);
        };

        // 生成图表
        const generateChart = () => {
            const canvas = document.getElementById('chartCanvas');
            const ctx = canvas.getContext('2d');
            
            // 解析数据 - 支持中英文逗号
            const parsedLabels = labels.value.split(/[,，]/).map(label => label.trim());
            const parsedData = dataValues.value.split(/[,，]/).map(value => parseFloat(value.trim()));
            
            // 计算统计数据
            calculateStatistics(parsedData);
            
            // 如果已经有图表，销毁它
            if (currentChart) {
                currentChart.destroy();
            }
            
            // 配置图表选项
            chartConfig = {
                type: selectedChartType.value,
                data: {
                    labels: parsedLabels,
                    datasets: [{
                        label: datasetLabel.value || '数据集',
                        data: parsedData,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            };
            
            // 根据图表类型添加特定配置
            if (selectedChartType.value === 'bar' || selectedChartType.value === 'line') {
                chartConfig.options.scales = {
                    x: {
                        title: {
                            display: true,
                            text: xAxisLabel.value
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisLabel.value
                        },
                        beginAtZero: true
                    }
                };
                
                // 折线图特定样式
                if (selectedChartType.value === 'line') {
                    chartConfig.data.datasets[0].tension = 0.3;
                    chartConfig.data.datasets[0].fill = false;
                    chartConfig.data.datasets[0].borderColor = 'rgb(75, 192, 192)';
                    chartConfig.data.datasets[0].backgroundColor = 'rgba(75, 192, 192, 0.5)';
                } else {
                    // 柱状图特定样式
                    chartConfig.data.datasets[0].backgroundColor = 'rgba(54, 162, 235, 0.5)';
                    chartConfig.data.datasets[0].borderColor = 'rgb(54, 162, 235)';
                }
            } else if (selectedChartType.value === 'pie' || selectedChartType.value === 'doughnut' || selectedChartType.value === 'polarArea') {
                // 解析背景颜色
                let colors = [];
                if (backgroundColors.value) {
                    colors = backgroundColors.value.split(/[,，]/).map(color => color.trim());
                } else {
                    // 默认颜色
                    colors = [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ];
                }
                
                // 确保有足够的颜色
                while (colors.length < parsedData.length) {
                    colors = colors.concat(colors);
                }
                
                chartConfig.data.datasets[0].backgroundColor = colors.slice(0, parsedData.length);
                chartConfig.data.datasets[0].borderColor = 'white';
                chartConfig.data.datasets[0].borderWidth = 2;
                
                // 添加图例
                chartConfig.options.plugins = {
                    legend: {
                        position: 'right'
                    }
                };
            } else if (selectedChartType.value === 'radar') {
                chartConfig.data.datasets[0].backgroundColor = 'rgba(54, 162, 235, 0.2)';
                chartConfig.data.datasets[0].borderColor = 'rgb(54, 162, 235)';
                chartConfig.data.datasets[0].pointBackgroundColor = 'rgb(54, 162, 235)';
                chartConfig.data.datasets[0].pointBorderColor = '#fff';
                chartConfig.data.datasets[0].pointHoverBackgroundColor = '#fff';
                chartConfig.data.datasets[0].pointHoverBorderColor = 'rgb(54, 162, 235)';
            }
            
            // 创建图表
            currentChart = new Chart(ctx, chartConfig);
            chartGenerated.value = true;
        };

        // 切换全屏模式
        const toggleFullscreen = () => {
            isFullscreen.value = !isFullscreen.value;
            
            // 如果进入全屏模式，等待DOM更新后重新绘制图表
            if (isFullscreen.value) {
                setTimeout(() => {
                    const fullscreenCanvas = document.getElementById('fullscreenChartCanvas');
                    const fullscreenCtx = fullscreenCanvas.getContext('2d');
                    
                    // 如果已经有全屏图表，销毁它
                    if (fullscreenChart) {
                        fullscreenChart.destroy();
                    }
                    
                    // 创建新的图表配置，专门用于全屏模式
                    const fullscreenChartConfig = JSON.parse(JSON.stringify(chartConfig)); // 深拷贝
                    
                    // 修改配置，确保图表能够完全填充容器
                    fullscreenChartConfig.options = {
                        ...fullscreenChartConfig.options,
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                            padding: {
                                top: 10,
                                right: 10,
                                bottom: 10,
                                left: 10
                            }
                        },
                        plugins: {
                            ...fullscreenChartConfig.options?.plugins,
                            legend: {
                                position: 'top',
                                labels: {
                                    font: {
                                        size: 14
                                    },
                                    padding: 20
                                }
                            },
                            title: {
                                display: true,
                                text: datasetLabel.value || '数据图表',
                                font: {
                                    size: 18,
                                    weight: 'bold'
                                },
                                padding: {
                                    top: 10,
                                    bottom: 30
                                }
                            }
                        }
                    };
                    
                    // 调整Canvas尺寸以适应容器
                    const container = fullscreenCanvas.parentElement;
                    fullscreenCanvas.width = container.clientWidth;
                    fullscreenCanvas.height = container.clientHeight;
                    
                    // 创建新的全屏图表
                    fullscreenChart = new Chart(fullscreenCtx, fullscreenChartConfig);
                }, 100); 
            } else {
                // 退出全屏模式时销毁全屏图表
                if (fullscreenChart) {
                    fullscreenChart.destroy();
                    fullscreenChart = null;
                }
            }
        };

        return {
            chartTypes,
            selectedChartType,
            labels,
            dataValues,
            backgroundColors,
            datasetLabel,
            xAxisLabel,
            yAxisLabel,
            statistics,
            chartGenerated,
            isFullscreen,
            selectChartType,
            generateChart,
            toggleFullscreen
        };
    }
}).mount('#app');
