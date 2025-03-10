import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { FaWallet, FaDollarSign, FaPlus } from 'react-icons/fa';

const AddIncome = () => {
	const [amount, setAmount] = useState('');
	const [description, setDescription] = useState('');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [frequency, setFrequency] = useState('');
	const [repeatCount, setRepeatCount] = useState('');
	const [categories, setCategories] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState('');
	const [user, setUser] = useState(null);
	const [incomes, setIncomes] = useState([]);
	const [currency, setCurrency] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [categoriesLoaded, setCategoriesLoaded] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		const storedUser = localStorage.getItem('userData');
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		} else {
			navigate('/login');
		}
	}, [navigate]);

	useEffect(() => {
		if (!user || !user.userId) {
			setLoading(false);
			return;
		}

		const fetchInitialData = async () => {
			try {
				if (!categoriesLoaded) {
					const categoriesResponse = await fetch(
						`${API_BASE_URL}/operation-categories`
					);
					if (categoriesResponse.ok) {
						setCategories(await categoriesResponse.json());
						setCategoriesLoaded(true);
					}
				}

				if (user.currencyId && !currency) {
					const currencyResponse = await fetch(
						`${API_BASE_URL}/currency/${user.currencyId}`
					);
					if (currencyResponse.ok) {
						setCurrency(await currencyResponse.json());
					}
				}

				await fetchIncomes();
			} catch (error) {
			} finally {
				setLoading(false);
			}
		};

		fetchInitialData();
	}, [user]);

	const fetchIncomes = async () => {
		try {
			if (!user?.userId) return;
			const response = await fetch(`${API_BASE_URL}/incomes/${user.userId}`);
			if (!response.ok) {
				throw new Error(`Не удалось загрузить доходы: ${response.statusText}`);
			}
			setIncomes(await response.json());
		} catch (error) {
			setIncomes([]);
		}
	};

	const fetchFreshUserData = async () => {
		try {
			setLoading(true);
			const userId = user?.userId;
			if (!userId) {
				navigate('/login');
				return null;
			}

			const userResponse = await fetch(`${API_BASE_URL}/user/${userId}`);
			if (!userResponse.ok) {
				throw new Error('Не удалось загрузить данные пользователя');
			}
			const freshUserData = await userResponse.json();

			const updatedUserData = { ...user };
			if (freshUserData.username && freshUserData.username !== user.username) {
				updatedUserData.username = freshUserData.username;
			}
			if (freshUserData.email && freshUserData.email !== user.email) {
				updatedUserData.email = freshUserData.email;
			}
			if (
				freshUserData.currentBalance !== undefined &&
				freshUserData.currentBalance !== user.currentBalance
			) {
				updatedUserData.currentBalance = freshUserData.currentBalance;
			}
			if (
				freshUserData.createdAt &&
				freshUserData.createdAt !== user.createdAt
			) {
				updatedUserData.createdAt = freshUserData.createdAt;
			}
			if (
				freshUserData.lastLogin &&
				freshUserData.lastLogin !== user.lastLogin
			) {
				updatedUserData.lastLogin = freshUserData.lastLogin;
			}
			if (
				freshUserData.currencyId &&
				freshUserData.currencyId !== user.currencyId
			) {
				updatedUserData.currencyId = freshUserData.currencyId;
			}
			if (freshUserData.imageUrl && freshUserData.imageUrl !== user.imageUrl) {
				updatedUserData.imageUrl = freshUserData.imageUrl;
			}
			if (freshUserData.id && freshUserData.id !== user.id) {
				updatedUserData.id = freshUserData.id;
			}
			if (
				freshUserData.passwordHash !== undefined &&
				freshUserData.passwordHash !== user.passwordHash
			) {
				updatedUserData.passwordHash = freshUserData.passwordHash;
			}

			localStorage.setItem('userData', JSON.stringify(updatedUserData));
			setUser(updatedUserData);
			return updatedUserData;
		} catch (error) {
			return null;
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async e => {
		e.preventDefault();

		if (
			!amount ||
			!description ||
			!startDate ||
			!endDate ||
			!frequency ||
			!selectedCategory ||
			!repeatCount
		) {
			alert('Пожалуйста, заполните все обязательные поля.');
			return;
		}

		const incomeData = {
			amount: parseFloat(amount),
			description,
			startDate,
			endDate,
			frequency,
			repeatCount: parseInt(repeatCount),
			operationCategoryId: selectedCategory,
			userId: user?.userId,
		};

		try {
			const response = await fetch(`${API_BASE_URL}/incomes`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(incomeData),
			});

			if (!response.ok) {
				throw new Error('Ошибка при добавлении дохода');
			}

			await fetchFreshUserData();
			await fetchIncomes();

			setAmount('');
			setDescription('');
			setStartDate('');
			setEndDate('');
			setFrequency('');
			setRepeatCount('');
			setSelectedCategory('');
			setShowModal(false);
		} catch (error) {
			alert('Не удалось добавить доход. Попробуйте снова.');
		}
	};

	const openModal = () => setShowModal(true);
	const closeModal = () => setShowModal(false);

	if (loading)
		return <div className='text-gray-200 text-center p-6'>Загрузка...</div>;
	if (!user) return null;

	return (
		<div className='p-6 bg-gray-900 text-gray-200 min-h-screen'>
			<div className='flex justify-between items-center mb-6'>
				<h2 className='text-2xl font-semibold text-white'>Постоянные доходы</h2>
				<button
					onClick={openModal}
					className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
				>
					<FaPlus className='w-5 h-5' /> Добавить доход
				</button>
			</div>

			<div className='mb-8'>
				{incomes.length > 0 ? (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{incomes.map(income => (
							<div
								key={income.id}
								className='p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 hover:border-green-500 transition-all duration-300'
							>
								<div className='flex items-center gap-3 mb-4'>
									<div className='p-3 bg-green-500/10 rounded-lg'>
										<FaDollarSign className='text-green-400 w-6 h-6' />
									</div>
									<h4 className='font-semibold text-gray-100 text-lg'>
										{income.description}
									</h4>
								</div>
								<div className='space-y-3'>
									<div className='flex justify-between items-center'>
										<p className='text-gray-400'>Сумма:</p>
										<p className='text-gray-100 font-medium'>
											{income.amount} {currency?.currencyCode || ''}
										</p>
									</div>
									<div className='flex justify-between items-center'>
										<p className='text-gray-400'>Дата начала:</p>
										<p className='text-gray-100'>
											{new Date(income.startDate).toLocaleDateString()}
										</p>
									</div>
									<div className='flex justify-between items-center'>
										<p className='text-gray-400'>Дата окончания:</p>
										<p className='text-gray-100'>
											{new Date(income.endDate).toLocaleDateString()}
										</p>
									</div>
									<div className='flex justify-between items-center'>
										<p className='text-gray-400'>Частота:</p>
										<p className='text-gray-100 capitalize'>
											{income.frequency}
										</p>
									</div>
									<div className='flex justify-between items-center'>
										<p className='text-gray-400'>Категория:</p>
										<p className='text-gray-100'>
											{categories.find(
												cat => cat.id === income.operationCategoryId
											)?.categoryName || 'Не указано'}
										</p>
									</div>
									<div className='flex justify-between items-center'>
										<p className='text-gray-400'>Повторений:</p>
										<p className='text-gray-100'>{income.repeatCount}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='p-6 bg-gray-800 rounded-2xl border border-dashed border-gray-700 text-center'>
						<p className='text-gray-400'>Нет постоянных доходов.</p>
					</div>
				)}
			</div>

			{showModal && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
					<div className='w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700'>
						<h2 className='text-3xl font-bold text-white mb-6 text-center'>
							Добавить доход
						</h2>
						<form onSubmit={handleSubmit} className='space-y-6'>
							<div>
								<label
									htmlFor='amount'
									className='block text-sm font-medium text-gray-300 mb-2'
								>
									Сумма
								</label>
								<input
									type='number'
									id='amount'
									placeholder='Введите сумму'
									value={amount}
									onChange={e => setAmount(e.target.value)}
									className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 placeholder-gray-400'
									step='0.01'
									min='0'
									required
								/>
							</div>

							<div>
								<label
									htmlFor='description'
									className='block text-sm font-medium text-gray-300 mb-2'
								>
									Описание
								</label>
								<input
									type='text'
									id='description'
									placeholder='Введите описание'
									value={description}
									onChange={e => setDescription(e.target.value)}
									className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 placeholder-gray-400'
									required
								/>
							</div>

							<div>
								<label
									htmlFor='selectedCategory'
									className='block text-sm font-medium text-gray-300 mb-2'
								>
									Категория
								</label>
								<select
									id='selectedCategory'
									value={selectedCategory}
									onChange={e => setSelectedCategory(e.target.value)}
									className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200'
									required
								>
									<option className='text-gray-300' value=''>
										Выберите категорию
									</option>
									{categories.map(category => (
										<option
											className='text-gray-300'
											key={category.id}
											value={category.id}
										>
											{category.categoryName}
										</option>
									))}
								</select>
							</div>

							<div>
								<label
									htmlFor='frequency'
									className='block text-sm font-medium text-gray-300 mb-2'
								>
									Частота
								</label>
								<select
									id='frequency'
									value={frequency}
									onChange={e => setFrequency(e.target.value)}
									className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200'
									required
								>
									<option className='text-gray-300' value=''>
										Выберите частоту
									</option>
									<option className='text-gray-300' value='Monthly'>
										Ежемесячно
									</option>
									<option className='text-gray-300' value='Yearly'>
										Ежегодно
									</option>
									<option className='text-gray-300' value='Daily'>
										Ежедневно
									</option>
								</select>
							</div>

							<div>
								<label
									htmlFor='startDate'
									className='block text-sm font-medium text-gray-300 mb-2'
								>
									Дата начала
								</label>
								<input
									type='date'
									id='startDate'
									value={startDate}
									onChange={e => setStartDate(e.target.value)}
									className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200'
									required
								/>
							</div>

							<div>
								<label
									htmlFor='endDate'
									className='block text-sm font-medium text-gray-300 mb-2'
								>
									Дата окончания
								</label>
								<input
									type='date'
									id='endDate'
									value={endDate}
									onChange={e => setEndDate(e.target.value)}
									className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200'
									required
								/>
							</div>

							<div>
								<label
									htmlFor='repeatCount'
									className='block text-sm font-medium text-gray-300 mb-2'
								>
									Количество повторений
								</label>
								<input
									type='number'
									id='repeatCount'
									placeholder='Введите количество'
									value={repeatCount}
									onChange={e => setRepeatCount(e.target.value)}
									className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 placeholder-gray-400'
									min='0'
									required
								/>
							</div>

							<div className='flex gap-4'>
								<button
									type='submit'
									className='w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium'
								>
									Добавить доход
								</button>
								<button
									type='button'
									onClick={closeModal}
									className='w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium'
								>
									Отмена
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default AddIncome;
