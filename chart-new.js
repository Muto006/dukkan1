// Grafik Sayfası - Temiz Versiyon
class GrafikSayfasi {
    constructor() {
        this.transactions = [];
        this.monthlyChart = null;
        
        this.initializeElements();
        this.initFirebase();
    }
    
    // Firebase başlatma
    async initFirebase() {
        const checkFirebase = () => {
            if (window.firebaseService) {
                this.loadFirebaseData();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }
    
    // Firebase'den veri yükle
    async loadFirebaseData() {
        try {
            const firebaseTransactions = await window.firebaseService.loadUserData();
            this.transactions = firebaseTransactions;
            this.updateSummary();
            this.initializeChart();
            console.log('Grafik sayfası veri yüklendi:', firebaseTransactions.length, 'kayıt');
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            // Hata durumunda LocalStorage'dan yükle
            this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            this.updateSummary();
            this.initializeChart();
        }
    }

    initializeElements() {
        this.totalIncomeElement = document.getElementById('totalIncome');
        this.totalExpenseElement = document.getElementById('totalExpense');
        this.totalProfitElement = document.getElementById('totalProfit');
    }

    updateSummary() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (isNaN(t.amount) ? 0 : t.amount), 0);

        const expense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (isNaN(t.amount) ? 0 : t.amount), 0);

        const profit = income - expense;

        this.totalIncomeElement.textContent = this.formatCurrency(income);
        this.totalExpenseElement.textContent = this.formatCurrency(expense);
        this.totalProfitElement.textContent = this.formatCurrency(profit);

        // Kar durumuna göre renk değiştir
        this.totalProfitElement.className = profit >= 0 ? 'positive' : 'negative';
    }

    initializeChart() {
        this.updateChart();
    }

    getMonthlyData() {
        const monthlyData = {
            income: new Array(12).fill(0),
            expense: new Array(12).fill(0),
            profit: new Array(12).fill(0)
        };

        this.transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            const month = transactionDate.getMonth();
            if (transaction.type === 'income') {
                monthlyData.income[month] += transaction.amount;
            } else {
                monthlyData.expense[month] += transaction.amount;
            }
        });

        // Kar hesapla
        for (let i = 0; i < 12; i++) {
            monthlyData.profit[i] = monthlyData.income[i] - monthlyData.expense[i];
        }

        return monthlyData;
    }

    updateChart() {
        const monthlyData = this.getMonthlyData();
        
        const months = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];

        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        // Mevcut grafiği yok et
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }

        // Eğer hiç veri yoksa mesaj göster
        if (monthlyData.profit.every(profit => profit === 0)) {
            this.showEmptyMessage();
            return;
        }

        // Grafik verilerini hazırla
        const chartData = monthlyData.profit;
        const chartLabels = months;
        const chartColors = monthlyData.profit.map(profit => 
            profit >= 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'
        );

        this.createChart(ctx, chartData, chartLabels, chartColors);
    }

    createChart(ctx, data, labels, colors) {
        this.monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Aylık Kar/Zarar (₺)',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.8', '1')),
                    borderWidth: 2,
                    borderRadius: 5,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Aylık Kar/Zarar Grafiği',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        color: '#333'
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const formattedValue = new Intl.NumberFormat('tr-TR', {
                                    style: 'currency',
                                    currency: 'TRY'
                                }).format(value);
                                return `${context.label}: ${formattedValue}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('tr-TR', {
                                    style: 'currency',
                                    currency: 'TRY',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(value);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    }

    showEmptyMessage() {
        const chartContainer = document.querySelector('.chart-container');
        chartContainer.innerHTML = `
            <div class="empty-chart-message">
                <i class="fas fa-chart-bar"></i>
                <h3>Henüz Veri Yok</h3>
                <p>Grafik görüntülemek için önce ana sayfadan veri ekleyin.</p>
                <a href="index-new.html" class="btn-back">
                    <i class="fas fa-arrow-left"></i> Ana Sayfaya Dön
                </a>
            </div>
        `;
    }
}

// Grafik sayfasını başlat
new GrafikSayfasi(); 