"use client"

import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Button } from './ui/button'
import { deleteWorkspace } from '@/actions/workspace';
import { useRouter } from 'next/navigation';

function DeleteWorkspaceButton({ workspaceId }: { workspaceId: string }) {

    const router = useRouter()

    async function handleDelete() {
        const response = await deleteWorkspace(workspaceId);
        if (response.success) {
            toast.success(response.message);
            router.refresh()
        } else {
            toast.error(response.message)
        }
    }


    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
                >
                    <div className='flex gap-2 items-center'>
                        Delete Workspace
                    </div>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the workspace and all the tasks.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default DeleteWorkspaceButton