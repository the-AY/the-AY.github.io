function openBookingModal(title, duration) {
    const modal = document.getElementById('bookingModal');
    const titleEl = document.getElementById('modalTitle');
    const durationEl = document.getElementById('modalDuration');
    
    // Update modal content based on selected service
    titleEl.textContent = title;
    durationEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${duration}`;
    
    // Show modal
    modal.classList.add('active');
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    
    // Hide modal
    modal.classList.remove('active');
    
    // Restore background scrolling
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside of it
document.getElementById('bookingModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeBookingModal();
    }
});

// Optional: Add smooth entrance animations to cards
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.service-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease ' + (index * 0.1) + 's';
        
        // Trigger reflow
        void card.offsetWidth;
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    });
});
