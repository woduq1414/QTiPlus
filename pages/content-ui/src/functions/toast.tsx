import toast from 'react-hot-toast';

function makeToast(message: string) {
  toast(
    t => (
      <div
        style={{
          backgroundColor: '#2d3748',
          color: '#f7fafc',
          padding: '0.5rem 1rem',
          borderRadius: '1rem',
          fontSize: '1rem',
        }}>
        {message}
      </div>
    ),
    {
      duration: 3000,
    },
  );
}

export default makeToast;
