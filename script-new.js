// Muhasebe Sistemi - Temiz Versiyon
class MuhasebeSistemi {
    constructor() {
        this.transactions = [];
        this.currentFilter = 'all';
        this.currentMonthFilter = 'all';
        this.searchTerm = '';
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.setDefaultDate();
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
            this.renderTransactions();
            console.log('Firebase\'den veri yüklendi:', firebaseTransactions.length, 'kayıt');
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            // Hata durumunda LocalStorage'dan yükle
            this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            this.updateSummary();
            this.renderTransactions();
        }
    }

    initializeElements() {
        // Form elementleri
        this.form = document.getElementById('transactionForm');
        this.typeSelect = document.getElementById('type');
        this.amountInput = document.getElementById('amount');
        this.descriptionInput = document.getElementById('description');
        this.dateInput = document.getElementById('date');
        
        // Filtre elementleri
        this.filterSelect = document.getElementById('filterType');
        this.filterMonthSelect = document.getElementById('filterMonth');
        this.searchInput = document.getElementById('searchInput');
        
        // Tablo elementleri
        this.transactionsBody = document.getElementById('transactionsBody');
        
        // Özet elementleri
        this.totalIncomeElement = document.getElementById('totalIncome');
        this.totalExpenseElement = document.getElementById('totalExpense');
        this.totalProfitElement = document.getElementById('totalProfit');
        
        // Modal elementleri
        this.editModal = document.getElementById('editModal');
        this.editForm = document.getElementById('editForm');
        this.editTypeSelect = document.getElementById('editType');
        this.editAmountInput = document.getElementById('editAmount');
        this.editDescriptionInput = document.getElementById('editDescription');
        this.editDateInput = document.getElementById('editDate');
    }

    bindEvents() {
        // Form submit
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Filtreler
        this.filterSelect.addEventListener('change', (e) => this.handleFilterChange(e));
        this.filterMonthSelect.addEventListener('change', (e) => this.handleMonthFilterChange(e));
        this.searchInput.addEventListener('input', (e) => this.handleSearchChange(e));
        
        // Modal
        this.editForm.addEventListener('submit', (e) => this.handleEditFormSubmit(e));
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        this.dateInput.value = today;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const amount = parseFloat(this.amountInput.value);
        const description = this.descriptionInput.value.trim();
        
        if (isNaN(amount) || amount <= 0) {
            this.showNotification('Lütfen geçerli bir tutar girin!', 'error');
            return;
        }
        
        if (!description) {
            this.showNotification('Lütfen detay açıklaması girin!', 'error');
            return;
        }
        
        const transaction = {
            id: Date.now(),
            type: this.typeSelect.value,
            amount: amount,
            description: description,
            date: this.dateInput.value,
            createdAt: new Date().toISOString()
        };

        this.addTransaction(transaction);
        this.form.reset();
        this.setDefaultDate();
        this.showNotification('Kayıt başarıyla eklendi!', 'success');
    }

    async addTransaction(transaction) {
        if (window.firebaseService && window.firebaseService.isAuthenticated()) {
            try {
                await window.firebaseService.addTransaction(transaction);
                // Firebase'den güncel veriyi yükle
                await this.loadFirebaseData();
            } catch (error) {
                console.error('Firebase kayıt hatası:', error);
                this.showNotification('Kayıt hatası! Firebase bağlantısını kontrol edin.', 'error');
            }
        } else {
            // Fallback: LocalStorage'a kaydet
            this.transactions.unshift(transaction);
            this.saveToLocalStorage();
            this.updateSummary();
            this.renderTransactions();
        }
    }

    async deleteTransaction(id) {
        if (confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
            if (window.firebaseService && window.firebaseService.isAuthenticated()) {
                try {
                    await window.firebaseService.deleteTransaction(id);
                    // Firebase'den güncel veriyi yükle
                    await this.loadFirebaseData();
                    this.showNotification('Kayıt silindi!', 'info');
                } catch (error) {
                    console.error('Firebase silme hatası:', error);
                    this.showNotification('Silme hatası!', 'error');
                }
            } else {
                // Fallback: LocalStorage'dan sil
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.saveToLocalStorage();
                this.updateSummary();
                this.renderTransactions();
                this.showNotification('Kayıt silindi!', 'info');
            }
        }
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.editingId = id;
        this.editTypeSelect.value = transaction.type;
        this.editAmountInput.value = transaction.amount;
        this.editDescriptionInput.value = transaction.description;
        this.editDateInput.value = transaction.date;

        this.editModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeEditModal() {
        this.editModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.editingId = null;
        this.editForm.reset();
    }

    async handleEditFormSubmit(e) {
        e.preventDefault();
        
        const amount = parseFloat(this.editAmountInput.value);
        const description = this.editDescriptionInput.value.trim();
        
        if (isNaN(amount) || amount <= 0) {
            this.showNotification('Lütfen geçerli bir tutar girin!', 'error');
            return;
        }
        
        if (!description) {
            this.showNotification('Lütfen detay açıklaması girin!', 'error');
            return;
        }

        const updatedTransaction = {
            type: this.editTypeSelect.value,
            amount: amount,
            description: description,
            date: this.editDateInput.value,
            updatedAt: new Date().toISOString()
        };

        if (window.firebaseService && window.firebaseService.isAuthenticated()) {
            try {
                await window.firebaseService.updateTransaction(this.editingId, updatedTransaction);
                // Firebase'den güncel veriyi yükle
                await this.loadFirebaseData();
                this.closeEditModal();
                this.showNotification('Kayıt başarıyla güncellendi!', 'success');
            } catch (error) {
                console.error('Firebase güncelleme hatası:', error);
                this.showNotification('Güncelleme hatası!', 'error');
            }
        } else {
            // Fallback: LocalStorage'da güncelle
            const index = this.transactions.findIndex(t => t.id === this.editingId);
            if (index !== -1) {
                this.transactions[index] = { ...this.transactions[index], ...updatedTransaction };
                this.saveToLocalStorage();
                this.updateSummary();
                this.renderTransactions();
                this.closeEditModal();
                this.showNotification('Kayıt başarıyla güncellendi!', 'success');
            }
        }
    }

    handleFilterChange(e) {
        this.currentFilter = e.target.value;
        this.renderTransactions();
    }

    handleMonthFilterChange(e) {
        this.currentMonthFilter = e.target.value;
        this.renderTransactions();
    }

    handleSearchChange(e) {
        this.searchTerm = e.target.value.toLowerCase();
        this.renderTransactions();
    }

    getFilteredTransactions() {
        let filtered = this.transactions;

        // Tür filtresi
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(t => t.type === this.currentFilter);
        }

        // Ay filtresi
        if (this.currentMonthFilter !== 'all') {
            const selectedMonth = parseInt(this.currentMonthFilter);
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === selectedMonth;
            });
        }

        // Arama filtresi
        if (this.searchTerm) {
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(this.searchTerm) ||
                t.amount.toString().includes(this.searchTerm)
            );
        }

        return filtered;
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

    renderTransactions() {
        const filteredTransactions = this.getFilteredTransactions();
        
        if (filteredTransactions.length === 0) {
            this.transactionsBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Henüz kayıt bulunmuyor.</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.transactionsBody.innerHTML = filteredTransactions.map(transaction => {
            const amount = isNaN(transaction.amount) ? 0 : transaction.amount;
            const description = transaction.description || 'Açıklama yok';
            
            return `
                <tr>
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>
                        <span class="transaction-type type-${transaction.type}">
                            ${transaction.type === 'income' ? 'Gelen' : 'Giden'}
                        </span>
                    </td>
                    <td>${this.escapeHtml(description)}</td>
                    <td class="amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(amount)}
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="muhasebe.editTransaction(${transaction.id})">
                                <i class="fas fa-edit"></i> Düzenle
                            </button>
                            <button class="btn-delete" onclick="muhasebe.deleteTransaction(${transaction.id})">
                                <i class="fas fa-trash"></i> Sil
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    showNotification(message, type = 'info') {
        // Mevcut notification'ları kaldır
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Yeni notification oluştur
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Stil ekle
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 1001;
                animation: slideInRight 0.3s ease;
            }
            .notification.success { background: #4CAF50; }
            .notification.error { background: #f44336; }
            .notification.info { background: #2196F3; }
            @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // 5 saniye sonra otomatik kaldır
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Veri dışa aktarma
    exportData() {
        const data = {
            transactions: this.transactions,
            summary: {
                totalIncome: this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                totalExpense: this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
                totalProfit: this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - 
                            this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
            },
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `muhasebe-verileri-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Veriler başarıyla dışa aktarıldı!', 'success');
    }

    // Veri içe aktarma
    importData() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.transactions && Array.isArray(data.transactions)) {
                            this.transactions = data.transactions;
                            this.saveToLocalStorage();
                            this.updateSummary();
                            this.renderTransactions();
                            this.showNotification('Veriler başarıyla içe aktarıldı!', 'success');
                        } else {
                            throw new Error('Geçersiz veri formatı');
                        }
                    } catch (error) {
                        this.showNotification('Veri içe aktarma hatası: ' + error.message, 'error');
                    }
                };
                
                reader.readAsText(file);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }
}

// Uygulamayı başlat
window.muhasebe = new MuhasebeSistemi(); 