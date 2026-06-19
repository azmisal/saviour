const endPoints = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    refreshToken: '/auth/refresh',
    logout: '/auth/logout',
    authCheck: '/auth/authcheck',
  },
  user: {
    profile: '/user/profile',
    updateProfile: '/user/update-profile',
    changePassword: '/user/change-password',
  },
  products: {
    list: '/products',
    details: (id: string) => `/products/${id}`,
    create: '/products/create',
    update: (id: string) => `/products/update/${id}`,
    delete: (id: string) => `/products/delete/${id}`,
  },
};

export default endPoints;