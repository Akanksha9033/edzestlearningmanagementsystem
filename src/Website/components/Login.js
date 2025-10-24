import React from 'react';

const Login = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-6 animate-fadeIn">
          Welcome to Edzest Education Services.
        </h2>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700" htmlFor="email">Email</label>
            <input type="email" id="email" name="email" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4748ac]" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700" htmlFor="password">Password</label>
            <input type="password" id="password" name="password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4748ac]" required />
          </div>
          <button type="submit" className="w-full bg-[#4748ac] hover:bg-[#3737ac] text-white py-2 px-4 rounded-lg transition duration-300">
            Log in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
