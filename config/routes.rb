Rails.application.routes.draw do
  root 'application#index'

  get     '/login',   to: 'sessions#new'
  post    '/login',   to: 'sessions#create'
  delete  '/logout',  to: 'sessions#destroy'

  post    '/transactions/many', to: 'transactions#create_many'

  resources :members
  resources :transactions
  resources :invitations, only: [:edit]

end
