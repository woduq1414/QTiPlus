import toast from 'react-hot-toast';

function makeToast(message: string) {
  toast(
    t => (
      <div
        style={{
          backgroundColor: 'rgba(45, 55, 72, 0.85)',
          color: '#f7fafc',
          padding: '0.5rem 1rem',
          borderRadius: '1rem',
          fontSize: '1rem',
          zIndex: 9999999999,
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
