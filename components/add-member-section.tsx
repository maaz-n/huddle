"use client";

import { useState } from 'react';
import AddMemberModal from './add-member-modal';
import { Button } from './ui/button';
import { addMember } from '@/actions/user';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';

interface AddMemberProps {
    workspaceId: string,
    currentUserRole: "owner" | "admin" | "member" | null
}

export default function AddMemberSection({ workspaceId, currentUserRole }: AddMemberProps) {
    const [isOpen, setIsOpen] = useState(false);

    const router = useRouter()

    const handleAddMember = async (email: string, role: string) => {
        const response = await addMember(workspaceId, role, email);
        if (response.success) {
            toast.success(response.message);
            router.refresh();

        } else {
            toast.error(response.message)
        }
    };

    return (
        <>
            {currentUserRole !== "member" && (
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    className="h-9 px-4 transition-all"
                >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                </Button>
            )}

            <AddMemberModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onAddMember={handleAddMember}
            />
        </>
    );
}