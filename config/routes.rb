Rails.application.routes.draw do
  root 'application#index'

  get     '/login',   to: 'sessions#new'
  post    '/login',   to: 'sessions#create'
  delete  '/logout',  to: 'sessions#destroy'

  resources :members
  resources :transactions
  resources :invitations, only: [:edit]

end
