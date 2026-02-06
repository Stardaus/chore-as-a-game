import React from 'react';
import { Button } from './Button';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

/**
 * Generic Modal/Dialog overlay.
 * 
 * @description
 * Renders a centered, backdrop-blurred overlay with a content box.
 * Handles open/closed state via props (controlled component).
 * 
 * @param isOpen - Controls visibility.
 * @param onClose - Callback when the close button or backdrop is clicked.
 * @param title - Header title for the modal.
 * @usedBy
 * - AssignChoreModal
 * - BulkAssignModal
 */
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
